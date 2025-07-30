import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment';
import { Collection } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';
import Parser from 'rss-parser';

import { ArticleDBProps, RSSItem } from '@/domains/article';
import { getArticlesCollection } from '@/lib/mongodb';
import { HttpStatus } from '@/utils/api';
import {
  EXCLUDED_KEYWORDS,
  ExecutionReport,
  generateSingleArticle as generateArticle,
  generateExecutionReport,
  getExistingArticles,
  saveArticlesToDB,
  sendExecutionReport,
} from '@/utils/generateArticle';
import { isAdminToken } from '@/utils/token';

const DAYS_RANGE = 15;

interface CategoryItem {
  _?: string;
  name?: string;
  text?: string;
}

interface ArticleSourceData {
  latestSourceDate: Date | null;
  usedSourceUrls: string[];
}

type RSSCategoryType = string | CategoryItem;

interface SiteConfig {
  container: string;
  title: string;
  link: string;
  description: string;
  date: string;
}

const rssParser = new Parser({
  timeout: 10000,
  customFields: {
    item: ['description', 'summary', 'dc:creator'],
  },
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(HttpStatus.MethodNotAllowed).json({ message: `Method ${req.method} not allowed` });
  }

  try {
    const isAdmin = await isAdminToken(req.headers.authorization);
    if (!isAdmin) return res.status(HttpStatus.Forbidden).json({ message: 'Insufficient permissions' });
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(HttpStatus.Unauthorized).json({ message: 'Invalid token' });
  }

  try {
    const rssItems = await fetchRSSNews();
    console.error(`Fetched ${rssItems.length} RSS items`);

    const sourceData = await getArticleSourceData();
    console.error(`Found ${sourceData.usedSourceUrls.length} used source URLs`);

    const filteredItems = await filterNewsContent(rssItems, sourceData);
    console.error(`Filtered to ${filteredItems.length} items`);

    if (filteredItems.length === 0) {
      console.error('No items remaining after filtering, but continuing...');
      return res.status(HttpStatus.Ok).json({
        message: '已獲取RSS內容，但過濾後無符合條件的文章',
        report: createEmptyReport(),
      });
    }

    const uniqueItems = filteredItems.filter((item) => {
      const isUsed = sourceData.usedSourceUrls.includes(item.source_url);
      if (isUsed) {
        console.error(`Skipping duplicate source: ${item.title} (${item.source_url})`);
      }
      return !isUsed;
    });

    console.error(`After removing duplicates: ${uniqueItems.length} items remaining`);

    if (uniqueItems.length === 0) {
      console.error('No unique items remaining after filtering duplicates');
      return res.status(HttpStatus.Ok).json({
        message: '已獲取RSS內容，但去除重複來源後無新文章可處理',
        report: createEmptyReport(),
      });
    }

    const maxArticles = req.body.maxArticles || 10;
    const limitedItems = uniqueItems.slice(0, maxArticles);
    console.error(`Limited to ${limitedItems.length} items for processing`);

    const existingArticles = await getExistingArticles();
    const generatedArticles = await Promise.all(limitedItems.map((item) => generateArticle(item, existingArticles)));
    const savedArticles = await saveArticlesToDB(generatedArticles);
    const report = generateExecutionReport(limitedItems, savedArticles, generatedArticles);
    await sendExecutionReport(report);

    return res.status(HttpStatus.Ok).json({
      message: '文章生成完成',
      report,
    });
  } catch (error) {
    console.error('Generate articles process failed:', error);
    return res.status(HttpStatus.InternalServerError).json({
      message: `Server error: ${error}`,
    });
  }
};

const createEmptyReport = (): ExecutionReport => ({
  execution_time: moment().toISOString(),
  website_name: process.env.NEXT_PUBLIC_SITENAME || '',
  total_articles_processed: 0,
  successful_imports: 0,
  failed_imports: 0,
  cost_analysis: {
    total_tokens_used: 0,
    estimated_input_tokens: 0,
    estimated_output_tokens: 0,
    cost_usd: 0,
    cost_twd: 0,
    cost_breakdown: {
      input_cost_usd: 0,
      output_cost_usd: 0,
    },
  },
  api_usage: {
    openai_requests: 0,
    mongodb_operations: 0,
  },
  token_estimation_note: '未處理任何文章',
  article_urls: [],
});

const getArticleSourceData = async (): Promise<ArticleSourceData> => {
  const articlesCollection: Collection<Omit<ArticleDBProps, '_id'>> = await getArticlesCollection();

  const [latestArticle, articles] = await Promise.all([
    articlesCollection.findOne(
      { sourceDate: { $exists: true } },
      { sort: { sourceDate: -1 }, projection: { sourceDate: 1 } }
    ),
    articlesCollection
      .find({ sourceUrl: { $exists: true } })
      .project({ sourceUrl: 1 })
      .toArray(),
  ]);

  return {
    latestSourceDate: latestArticle?.sourceDate || null,
    usedSourceUrls: articles.map((article) => article.sourceUrl).filter((url): url is string => Boolean(url)),
  };
};

const parseHTMLAsRSS = async (url: string): Promise<RSSItem[]> => {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        Connection: 'keep-alive',
      },
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: (status) => status < 400,
    });

    const $ = cheerio.load(response.data);
    const articles: RSSItem[] = [];

    console.error(`HTML parsing started for ${url}`);

    const siteConfigs: Record<string, SiteConfig> = {
      'matchroompool.com': {
        container: 'article, .news-item, .post, .entry, .content-item, [class*="news"], [class*="post"], [class*="article"]',
        title: 'h1, h2, h3, h4, .title, .entry-title, .post-title, .news-title, [class*="title"], [class*="headline"]',
        link: 'a[href]',
        description: '.excerpt, .summary, p, .content, .description, [class*="excerpt"], [class*="summary"]',
        date: '.date, .published, time, .timestamp, [class*="date"], [datetime]',
      },
      'billiardsforum.com': {
        container: '.post, .topic, .thread, .news-item, article, [class*="post"], [class*="topic"]',
        title: 'h1, h2, h3, .title, .subject, .topic-title, [class*="title"]',
        link: 'a[href]',
        description: '.content, .excerpt, .summary, p, [class*="content"]',
        date: '.date, .time, .posted, time, [class*="date"], [class*="time"]',
      },
      default: {
        container:
          'article, .post, .news-item, .entry, .content-item, [class*="news"], [class*="post"], [class*="article"], [class*="item"]',
        title: 'h1, h2, h3, h4, .title, .headline, [class*="title"], [class*="headline"]',
        link: 'a[href]',
        description:
          'p, .excerpt, .summary, .content, .description, [class*="excerpt"], [class*="summary"], [class*="content"]',
        date: '.date, time, .published, .timestamp, [datetime], [class*="date"], [class*="time"]',
      },
    };

    const domain = new URL(url).hostname;
    const config = siteConfigs[domain] || siteConfigs['default'];

    console.error(`Using config for ${domain}:`, config);

    let containers = $(config.container);
    console.error(`Found ${containers.length} potential containers`);

    if (containers.length === 0) {
      console.error('No containers found, trying fallback selectors');

      const fallbackSelectors = [
        'article',
        '.post',
        '.news',
        '.entry',
        '.item',
        '[class*="post"]',
        '[class*="news"]',
        '[class*="article"]',
        '[class*="entry"]',
        'main article',
        'main .post',
        '.content article',
        '.content .post',
      ];

      for (const selector of fallbackSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          console.error(`Found ${elements.length} elements with fallback selector: ${selector}`);
          containers = elements;
          break;
        }
      }
    }

    containers.each((i, elem) => {
      if (i >= 10) return false;

      try {
        const $elem = $(elem);

        let title = '';
        const titleSelectors = config.title.split(', ');
        for (const selector of titleSelectors) {
          try {
            const titleText = $elem.find(selector).first().text().trim();
            if (titleText) {
              title = titleText;
              break;
            }
          } catch (selectorError) {
            console.error(`Title selector failed: ${selector}`, selectorError);
          }
        }

        if (!title) {
          try {
            title = $elem.attr('title') || $elem.find('[title]').first().attr('title') || '';
          } catch (attrError) {
            console.error('Title attribute extraction failed:', attrError);
          }
        }

        let link = '';
        try {
          const linkElem = $elem.find(config.link).first();
          if (linkElem.length > 0) {
            link = linkElem.attr('href') || '';
          } else {
            link = $elem.closest('a').attr('href') || $elem.find('a').first().attr('href') || '';
          }
        } catch (linkError) {
          console.error('Link extraction failed:', linkError);
        }

        let description = '';
        const descSelectors = config.description.split(', ');
        for (const selector of descSelectors) {
          try {
            const descText = $elem.find(selector).first().text().trim();
            if (descText && descText.length > 20) {
              description = descText.substring(0, 200);
              break;
            }
          } catch (descError) {
            console.error(`Description selector failed: ${selector}`, descError);
          }
        }

        console.error(`Item ${i}: title="${title}", link="${link}", desc length=${description.length}`);

        if (title && link) {
          let fullLink = '';
          try {
            fullLink = link.startsWith('http') ? link : new URL(link, url).href;
          } catch (urlError) {
            console.error(`Invalid URL: ${link}`, urlError);
            return;
          }

          let publishedDate = moment().toISOString();
          const dateSelectors = config.date.split(', ');
          for (const selector of dateSelectors) {
            try {
              const dateElem = $elem.find(selector).first();
              const dateText = dateElem.text().trim() || dateElem.attr('datetime') || dateElem.attr('title');
              if (dateText) {
                try {
                  const parsedDate = moment(dateText);
                  if (parsedDate.isValid()) {
                    publishedDate = parsedDate.toISOString();
                    break;
                  }
                } catch {
                  // 繼續嘗試下一個選擇器
                }
              }
            } catch (dateError) {
              console.error(`Date selector failed: ${selector}`, dateError);
            }
          }

          articles.push({
            title,
            content: description || title,
            published_date: publishedDate,
            source_url: fullLink,
            category: '撞球新聞',
          });
        }
      } catch (itemError) {
        console.error(`Error processing HTML item ${i}:`, itemError);
      }
    });

    console.error(`HTML parsing completed for ${url}, extracted ${articles.length} articles`);

    if (articles.length === 0) {
      console.error(`Failed to extract articles from ${url}`);
      console.error(`Page title: ${$('title').text()}`);
      console.error(`Found h1-h6: ${$('h1, h2, h3, h4, h5, h6').length}`);
      console.error(`Found links: ${$('a[href]').length}`);
      console.error(`Found articles: ${$('article').length}`);
      console.error(`Found posts: ${$('.post, [class*="post"]').length}`);
      console.error(`Found news: ${$('.news, [class*="news"]').length}`);
    }

    return articles;
  } catch (error) {
    console.error(`HTML parsing failed for ${url}:`, error);
    return [];
  }
};

const fetchRSSNews = async (): Promise<RSSItem[]> => {
  const rssSources = process.env.RSS_SOURCES?.split(',') ?? [];

  if (rssSources.length === 0) {
    throw new Error('RSS_SOURCES is empty');
  }

  const allItems: RSSItem[] = [];
  const failedSources: string[] = [];

  for (const rssUrl of rssSources) {
    try {
      console.error(`Processing RSS source: ${rssUrl}`);

      let items: RSSItem[] = [];

      try {
        const feed = await rssParser.parseURL(rssUrl);
        items = feed.items
          .map((item) => {
            try {
              if (!item.title) {
                console.error(`RSS item missing title from ${rssUrl}, skipping...`);
                return null;
              }

              const content = item.contentSnippet || item.content || item.title;
              if (!content) {
                console.error(`RSS item missing content from ${rssUrl}, skipping...`);
                return null;
              }

              const date = item.isoDate || item.pubDate || moment().toISOString();

              let category = '一般新聞';
              if (item.categories && Array.isArray(item.categories)) {
                try {
                  category =
                    item.categories
                      .map((cat: RSSCategoryType) => {
                        if (typeof cat === 'string') {
                          return cat;
                        }
                        if (typeof cat === 'object' && cat !== null) {
                          const categoryObj = cat as CategoryItem;
                          return categoryObj._ || categoryObj.name || categoryObj.text || '';
                        }
                        return '';
                      })
                      .filter((cat): cat is string => Boolean(cat))
                      .join(',') || '一般新聞';
                } catch (catError) {
                  console.error(`Error processing categories for ${item.title}:`, catError);
                  category = '一般新聞';
                }
              }

              return {
                title: String(item.title),
                content: String(content),
                published_date: String(date),
                source_url: String(item.link || ''),
                category,
              };
            } catch (itemError) {
              console.error(`Error processing individual RSS item from ${rssUrl}:`, itemError);
              return null;
            }
          })
          .filter((item): item is RSSItem => item !== null);
      } catch (rssError) {
        console.error(`RSS parsing failed for ${rssUrl}, trying HTML parsing:`, rssError);

        items = await parseHTMLAsRSS(rssUrl);
      }

      allItems.push(...items);
      console.error(`Successfully processed ${items.length} items from ${rssUrl}`);
    } catch (error) {
      console.error(`Failed to process source ${rssUrl}:`, error);
      failedSources.push(rssUrl);
    }
  }

  if (allItems.length === 0) {
    throw new Error(`All RSS sources failed. Failed sources: ${failedSources.join(', ')}`);
  }

  if (failedSources.length > 0) {
    console.error(`Some RSS sources failed: ${failedSources.join(', ')}`);
  }

  return allItems;
};

const filterNewsContent = async (items: RSSItem[], sourceData: ArticleSourceData): Promise<RSSItem[]> => {
  console.error(`Starting filter with ${items.length} items`);

  const cutoffDate = moment().subtract(DAYS_RANGE, 'days').toDate();

  console.error(
    `Latest source date: ${sourceData.latestSourceDate ? moment(sourceData.latestSourceDate).toISOString() : 'none'}`
  );

  const filteredItems = items.filter((item) => {
    const itemDate = moment(item.published_date).toDate();

    if (itemDate < cutoffDate) {
      console.error(`Item filtered out by date range: ${item.title}`);
      return false;
    }

    if (sourceData.latestSourceDate && itemDate < sourceData.latestSourceDate) {
      console.error(
        `Item filtered out by latest source date: ${item.title} (${moment(itemDate).toISOString()} < ${moment(sourceData.latestSourceDate).toISOString()})`
      );
      return false;
    }

    const fullText = `${item.title} ${item.content}`;
    const hasExcludedKeyword = EXCLUDED_KEYWORDS.some((keyword) => fullText.includes(keyword));

    if (hasExcludedKeyword) {
      console.error(`Item filtered out by keyword: ${item.title}`);
      return false;
    }

    return true;
  });

  console.error(`After filtering: ${filteredItems.length} items remaining`);
  return filteredItems;
};

export default handler;
