// Global Variables
const OPENAI_MODEL = 'gpt-4o-mini';
const DAYS_RANGE = 15;
const EXCLUDED_KEYWORDS = [
  '娛樂',
  '藝人',
  '明星',
  '八卦',
  '性愛',
  '色情',
  '賭博',
  '暴力',
  '血腥',
  '犯罪',
  '死亡',
  '車禍',
  '政治',
  '選舉',
  '抗議',
  '示威',
];

const FIXED_AUTHOR_ID = '673868d5becfbcdd168ebeb0';
const EXCHANGE_RATE = 31.5;

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Collection } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import Parser from 'rss-parser';

import { ArticleDBProps } from '@/domains/article';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { getArticlesCollection } from '@/lib/mongodb';
import { HttpStatus } from '@/utils/api';
import sendEmail from '@/utils/sendEmail';
import { isAdminToken } from '@/utils/token';

interface RSSItem {
  title: string;
  content: string;
  published_date: string;
  source_url: string;
  category: string;
}

interface ProcessedArticle {
  title: string;
  description: string;
  tags: string[];
  content: string;
  category: string;
  sourceUrl: string;
  sourceDate: Date;
}

interface ExecutionReport {
  execution_time: string;
  website_name: string;
  total_articles_processed: number;
  successful_imports: number;
  failed_imports: number;
  cost_analysis: {
    total_tokens_used: number;
    estimated_input_tokens: number;
    estimated_output_tokens: number;
    cost_usd: number;
    cost_twd: number;
    cost_breakdown: {
      input_cost_usd: number;
      output_cost_usd: number;
    };
  };
  api_usage: {
    openai_requests: number;
    mongodb_operations: number;
  };
  token_estimation_note: string;
  article_urls: { title: string; url: string }[];
}

interface SiteConfig {
  container: string;
  title: string;
  link: string;
  description: string;
  date: string;
}

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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // 一次性獲取所有需要的數據
    const sourceData = await getArticleSourceData();
    console.error(`Found ${sourceData.usedSourceUrls.length} used source URLs`);

    // 使用組合數據進行過濾
    const filteredItems = await filterNewsContent(rssItems, sourceData);
    console.error(`Filtered to ${filteredItems.length} items`);

    // 如果過濾後沒有文章，直接返回而不是拋出錯誤
    if (filteredItems.length === 0) {
      console.error('No items remaining after filtering, but continuing...');
      return res.status(HttpStatus.Ok).json({
        message: '已獲取RSS內容，但過濾後無符合條件的文章',
        report: {
          execution_time: new Date().toISOString(),
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
        },
      });
    }

    // 過濾掉已經使用過的源URL（直接使用已獲取的數據）
    const uniqueItems = filteredItems.filter((item) => {
      const isUsed = sourceData.usedSourceUrls.includes(item.source_url);
      if (isUsed) {
        console.error(`Skipping duplicate source: ${item.title} (${item.source_url})`);
      }
      return !isUsed;
    });

    console.error(`After removing duplicates: ${uniqueItems.length} items remaining`);

    // 如果去重後沒有文章，直接返回
    if (uniqueItems.length === 0) {
      console.error('No unique items remaining after filtering duplicates');
      return res.status(HttpStatus.Ok).json({
        message: '已獲取RSS內容，但去除重複來源後無新文章可處理',
        report: {
          execution_time: new Date().toISOString(),
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
          token_estimation_note: '無新文章來源可處理',
          article_urls: [],
        },
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

// 新增：組合函數，一次性獲取所需數據
const getArticleSourceData = async (): Promise<ArticleSourceData> => {
  const articlesCollection: Collection<Omit<ArticleDBProps, '_id'>> = await getArticlesCollection();

  // 使用 Promise.all 並行執行兩個查詢
  const [latestArticle, articles] = await Promise.all([
    // 獲取最新的 source date
    articlesCollection.findOne(
      { sourceDate: { $exists: true } },
      { sort: { sourceDate: -1 }, projection: { sourceDate: 1 } }
    ),
    // 獲取所有使用過的 source URLs
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

    // 針對不同網站的選擇器配置 - 更通用的選擇器
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

    // 嘗試找到所有可能的容器
    let containers = $(config.container);
    console.error(`Found ${containers.length} potential containers`);

    // 如果沒找到容器，嘗試更通用的方法
    if (containers.length === 0) {
      console.error('No containers found, trying fallback selectors');

      // 嘗試所有可能包含文章的元素
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
      if (i >= 10) return false; // 限制數量

      try {
        // 添加 try-catch 包裝每個項目的處理
        const $elem = $(elem);

        // 嘗試多種方式找標題
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

        // 如果還是沒找到標題，嘗試從元素本身或子元素中找
        if (!title) {
          try {
            title = $elem.attr('title') || $elem.find('[title]').first().attr('title') || '';
          } catch (attrError) {
            console.error('Title attribute extraction failed:', attrError);
          }
        }

        // 嘗試找連結 - 同樣加上容錯
        let link = '';
        try {
          const linkElem = $elem.find(config.link).first();
          if (linkElem.length > 0) {
            link = linkElem.attr('href') || '';
          } else {
            // 嘗試從父級或子級找連結
            link = $elem.closest('a').attr('href') || $elem.find('a').first().attr('href') || '';
          }
        } catch (linkError) {
          console.error('Link extraction failed:', linkError);
        }

        // 嘗試找描述
        let description = '';
        const descSelectors = config.description.split(', ');
        for (const selector of descSelectors) {
          try {
            const descText = $elem.find(selector).first().text().trim();
            if (descText && descText.length > 20) {
              // 確保描述有意義
              description = descText.substring(0, 200);
              break;
            }
          } catch (descError) {
            console.error(`Description selector failed: ${selector}`, descError);
          }
        }

        console.error(`Item ${i}: title="${title}", link="${link}", desc length=${description.length}`);

        if (title && link) {
          // 處理相對連結
          let fullLink = '';
          try {
            fullLink = link.startsWith('http') ? link : new URL(link, url).href;
          } catch (urlError) {
            console.error(`Invalid URL: ${link}`, urlError);
            return; // 跳過這個項目
          }

          // 處理日期 - 嘗試多種方式
          let publishedDate = new Date().toISOString();
          const dateSelectors = config.date.split(', ');
          for (const selector of dateSelectors) {
            try {
              const dateElem = $elem.find(selector).first();
              const dateText = dateElem.text().trim() || dateElem.attr('datetime') || dateElem.attr('title');
              if (dateText) {
                try {
                  const parsedDate = new Date(dateText);
                  if (!isNaN(parsedDate.getTime())) {
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
        // 繼續處理下一個項目
      }
    });

    console.error(`HTML parsing completed for ${url}, extracted ${articles.length} articles`);

    // 如果還是沒有提取到內容，記錄更多調試信息
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

      // 首先嘗試RSS解析
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

              const date = item.isoDate || item.pubDate || new Date().toISOString();

              // 修復 category 處理邏輯
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

        // RSS解析失敗時，嘗試HTML解析
        items = await parseHTMLAsRSS(rssUrl);
      }

      allItems.push(...items);
      console.error(`Successfully processed ${items.length} items from ${rssUrl}`);
    } catch (error) {
      console.error(`Failed to process source ${rssUrl}:`, error);
      failedSources.push(rssUrl);
    }
  }

  // 如果所有RSS源都失敗，才停止流程
  if (allItems.length === 0) {
    throw new Error(`All RSS sources failed. Failed sources: ${failedSources.join(', ')}`);
  }

  // 如果有部分RSS源失敗，記錄但繼續
  if (failedSources.length > 0) {
    console.error(`Some RSS sources failed: ${failedSources.join(', ')}`);
  }

  return allItems;
};

// 修改後的 filterNewsContent 函數
const filterNewsContent = async (items: RSSItem[], sourceData: ArticleSourceData): Promise<RSSItem[]> => {
  console.error(`Starting filter with ${items.length} items`);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DAYS_RANGE);

  // 直接使用傳入的數據，不需要再次查詢數據庫
  console.error(`Latest source date: ${sourceData.latestSourceDate ? sourceData.latestSourceDate.toISOString() : 'none'}`);

  const filteredItems = items.filter((item) => {
    const itemDate = new Date(item.published_date);

    // 原有的日期範圍過濾
    if (itemDate < cutoffDate) {
      console.error(`Item filtered out by date range: ${item.title}`);
      return false;
    }

    // 使用傳入的最新來源日期
    if (sourceData.latestSourceDate && itemDate < sourceData.latestSourceDate) {
      console.error(
        `Item filtered out by latest source date: ${item.title} (${itemDate.toISOString()} < ${sourceData.latestSourceDate.toISOString()})`
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

const getExistingArticles = async (): Promise<string> => {
  const articlesCollection: Collection<Omit<ArticleDBProps, '_id'>> = await getArticlesCollection();
  const articles = await articlesCollection.find({}).sort({ createdAt: -1 }).limit(20).toArray();

  if (articles.length === 0) {
    return '- 暫無相關文章';
  }

  return articles.map((article) => `${article.title}: /${article.customLink}`).join('\n');
};

const generateArticle = async (newsItem: RSSItem, existingArticles: string): Promise<ProcessedArticle> => {
  const siteName = process.env.NEXT_PUBLIC_SITENAME || '';

  const prompt = `
你是${siteName}的專業撞球文案編輯。

基於以下新聞內容，請創建一篇與撞球相關的專業文章，不要用太論文的口吻來敘述，而是用專業但輕鬆的方式來說明，最好有點像一般網路文章或官網的小知識分享的感覺：

原始新聞標題：${newsItem.title}
新聞內容：${newsItem.content}
新聞分類：${newsItem.category}
發布日期：${newsItem.published_date}
新聞來源網址：${newsItem.source_url}

**可用的外部連結清單（請從中選擇相關的網站，這些都是經過驗證的真實網站）：**
- Icery.tw：https://www.Icery.tw
- Icery Official影片工作室：https://www.IceryOfficial.com
- 中華民國撞球協會：http://www.cuesports.org.tw
- Matchroom Pool撞球賽事組織：https://matchroompool.com
- AZ Billiards撞球資訊網：https://www.azbilliards.com
- Billiards Digest撞球雜誌：https://www.billiardsdigest.com
- 世界撞球協會WPA Pool：https://wpapool.com
- 美國撞球協會APA：https://poolplayers.com
- 世界撞球組織World Billiards：https://world-billiards.com
- 專業撞球系列賽Pro Billiard Series：https://probilliardseries.com
- AZ Billiards論壇：https://forums.azbilliards.com
- 撞球論壇Billiards Forum：http://www.billiardsforum.com

請產生以下JSON格式的內容：
{
  "title": "文章標題（15-25字，包含撞球關鍵字）",
  "description": "文章描述（80-130字的摘要）",
  "tags": ["5個與撞球相關的中文標籤"],
  "content": "完整文章內容（1000-2000字，必須使用Markdown格式）",
  "category": "撞球趣聞"
}

文章內容要求：
1. 使用 # 和 ## 標籤作為標題
2. **文章描述**（80-130字的摘要）
3. **關鍵字標籤**（5個與撞球相關的中文標籤）
4. **完整文章內容**（1000-2000字，**必須使用Markdown格式**）
  - 使用 ## 和 ### 標籤作為副標題，最多可以用到 ####
  - 使用條列式清單
  - 必須包含至少一個條列式清單
  - **需要至少3個跟內文相關的外部連結，必須從上方提供的清單中選擇**
  - **其中必須包含一個原始新聞的連結：${newsItem.title}(${newsItem.source_url})**
  - **其他外部連結請從上方清單中選擇最相關的網站，格式：[具體且有意義的連結文字](${newsItem.source_url})**
  - **嚴禁使用清單以外的網址，不可自行編造網址**
  - **連結文字必須具體說明連結內容**
  - **需要至少2個${siteName}現有的文章內部連結，除非沒有現有文章可以參考**
  - **如果連結到首頁，請使用：[${siteName}](/)**
  - **不要使用模糊的連結文字如"我們的網站"、"點擊這裡"、"這裡"、"點我"、"查看"、"這篇文章"、"這個網站"**
  - 內容要與原新聞結合撞球專業觀點
  - 使用SEO友善的寫作方式，盡量在文中多包涵相關關鍵字
  - 語調專業但易懂
  - 不需要包含完整標題在內文中
  - 內文不需包含引言或簡要等段落
  - 標題必須出現"撞球"兩個字
  - 內容主題不可與現有文章相似，必須是不同主題
  - 最後必須包含"總結"段落
  - 內文不可以出現單引號或雙引號，請用粗體表示強調

  **現有文章列表**：${existingArticles}
  - **內部連結格式：[具體文章標題或功能名稱](相對路徑)**
  - 請根據文章url來設置正確且確實有存在的內部連結
  - 請選擇與當前文章主題相關的現有文章進行連結，如果找不到相關文章，可以連結到主要頁面

5. **文章分類**：統一歸類到「撞球趣聞」

請確保內容原創且具有實用價值，所有外部連結都必須從提供的清單中選擇，所有人名、場地、比賽名稱不用特地轉成繁體中文，可以用該名稱原語言真實名稱，但其餘部分需保持繁體中文。

**重要：請只回傳純 JSON 格式，不要包含任何 markdown 標記、註解或其他文字。直接回傳 JSON 物件即可。**
`;

  const response = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      {
        role: 'system',
        content:
          '你是一位專業的撞球文案編輯，擅長將時事新聞轉換為撞球相關的實用內容。請只回傳純 JSON 格式，不要使用 markdown 或其他格式包裝。',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 2000,
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI response is empty');
  }

  // 清理 OpenAI 回應內容，移除可能的 markdown code block 標記
  const cleanContent = content
    .replace(/^```json\s*/i, '') // 移除開頭的 ```json
    .replace(/\s*```\s*$/i, '') // 移除結尾的 ```
    .trim();

  let parsed: ProcessedArticle;
  try {
    parsed = JSON.parse(cleanContent) as ProcessedArticle;
  } catch (parseError) {
    console.error('Failed to parse OpenAI response:', content);
    throw new Error(`Failed to parse OpenAI JSON response: ${parseError}`);
  }

  if (!parsed.title || !parsed.description || !parsed.content || !parsed.tags || parsed.tags.length === 0) {
    throw new Error('Generated article missing required fields');
  }

  return {
    ...parsed,
    sourceUrl: newsItem.source_url,
    sourceDate: new Date(newsItem.published_date),
  };
};

const saveArticlesToDB = async (articles: ProcessedArticle[]): Promise<ArticleDBProps[]> => {
  const articlesCollection: Collection<Omit<ArticleDBProps, '_id'>> = await getArticlesCollection();
  const savedArticles: ArticleDBProps[] = [];

  for (const article of articles) {
    const customLink = article.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').trim();

    if (!customLink) {
      throw new Error(`Failed to generate customLink for article: ${article.title}`);
    }

    const newArticle: Omit<ArticleDBProps, '_id'> = {
      title: article.title,
      author: FIXED_AUTHOR_ID,
      excerpt: article.description,
      content: article.content,
      featuredImg: '',
      customLink,
      tags: article.tags,
      sourceUrl: article.sourceUrl,
      sourceDate: article.sourceDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await articlesCollection.insertOne(newArticle);

    if (!result.insertedId) {
      throw new Error(`Failed to save article to database: ${article.title}`);
    }

    savedArticles.push({
      ...newArticle,
      _id: result.insertedId,
    });
  }

  return savedArticles;
};

const generateExecutionReport = (
  processedItems: RSSItem[],
  savedArticles: ArticleDBProps[],
  generatedArticles: ProcessedArticle[]
): ExecutionReport => {
  const totalTokens = generatedArticles.reduce((sum, article) => {
    return sum + (article.title + article.description + article.content).length / 4;
  }, 0);

  const estimatedInputTokens = totalTokens * 0.65;
  const estimatedOutputTokens = totalTokens * 0.35;

  const INPUT_COST_PER_1K_TOKENS = 0.00015;
  const OUTPUT_COST_PER_1K_TOKENS = 0.0006;

  const inputCostUSD = (estimatedInputTokens / 1000) * INPUT_COST_PER_1K_TOKENS;
  const outputCostUSD = (estimatedOutputTokens / 1000) * OUTPUT_COST_PER_1K_TOKENS;
  const totalCostUSD = inputCostUSD + outputCostUSD;
  const totalCostTWD = totalCostUSD * EXCHANGE_RATE;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const siteName = process.env.NEXT_PUBLIC_SITENAME || '';

  return {
    execution_time: new Date().toISOString(),
    website_name: siteName,
    total_articles_processed: processedItems.length,
    successful_imports: savedArticles.length,
    failed_imports: processedItems.length - savedArticles.length,
    cost_analysis: {
      total_tokens_used: Math.round(totalTokens),
      estimated_input_tokens: Math.round(estimatedInputTokens),
      estimated_output_tokens: Math.round(estimatedOutputTokens),
      cost_usd: Math.round(totalCostUSD * 10000) / 10000,
      cost_twd: Math.round(totalCostTWD * 100) / 100,
      cost_breakdown: {
        input_cost_usd: Math.round(inputCostUSD * 10000) / 10000,
        output_cost_usd: Math.round(outputCostUSD * 10000) / 10000,
      },
    },
    api_usage: {
      openai_requests: generatedArticles.length,
      mongodb_operations: savedArticles.length * 2,
    },
    token_estimation_note: 'Token計數是根據字元數÷4估算的，實際使用情況可能會有所不同',
    article_urls: savedArticles.map((article) => ({
      title: article.title,
      url: `${baseUrl}${getPageUrlByType(PageType.ARTICLES)}/${article.customLink}`,
    })),
  };
};

const sendExecutionReport = async (report: ExecutionReport): Promise<void> => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const siteName = process.env.NEXT_PUBLIC_SITENAME || '';

  if (!adminEmail) {
    throw new Error('Email configuration is missing');
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764b8e 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .section { margin-bottom: 25px; }
        .section-title { color: #667eea; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 5px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .stat-card { background: #f8f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; }
        .stat-number { font-size: 24px; font-weight: bold; color: #667eea; }
        .stat-label { color: #666; font-size: 14px; }
        .success { color: #27ae60; font-weight: bold; }
        .failed { color: #e74c3c; font-weight: bold; }
        .cost-breakdown { background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-info { background: #d1ecf1; color: #0c5460; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🐾 ${report.website_name} - 自動文章生成報告</h1>
            <p>執行時間：${report.execution_time}</p>
        </div>

        <div class="section">
            <div class="section-title">📊 執行摘要</div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${report.total_articles_processed}</div>
                    <div class="stat-label">處理文章總數</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number success">${report.successful_imports}</div>
                    <div class="stat-label">成功匯入</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number failed">${report.failed_imports}</div>
                    <div class="stat-label">匯入失敗</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${report.cost_analysis.total_tokens_used}</div>
                    <div class="stat-label">使用 Token 數</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">💰 成本分析</div>
            <div class="cost-breakdown">
                <p><strong>總成本：</strong> 
                   <span class="badge badge-info">$${report.cost_analysis.cost_usd}</span> 
                   <span class="badge badge-success">NT$${report.cost_analysis.cost_twd}</span>
                </p>
                <p><strong>Token 使用詳情：</strong></p>
                <ul>
                    <li>輸入 Token：${report.cost_analysis.estimated_input_tokens} ($${report.cost_analysis.cost_breakdown.input_cost_usd})</li>
                    <li>輸出 Token：${report.cost_analysis.estimated_output_tokens} ($${report.cost_analysis.cost_breakdown.output_cost_usd})</li>
                </ul>
                <p><em>${report.token_estimation_note}</em></p>
            </div>
        </div>

        <div class="section">
            <div class="section-title">文章連結</div>
            <div class="cost-breakdown">
                <ul>${report.article_urls.map(({ title, url }) => `<li><a href="${url}" target="_blank">${title}</a></li>`).join('')}</ul>
            </div>
        </div>

        <div class="section">
            <div class="section-title">🔧 API 使用統計</div>
            <ul>
                <li><strong>OpenAI 請求：</strong> ${report.api_usage.openai_requests} 次</li>
                <li><strong>MongoDB 操作：</strong> ${report.api_usage.mongodb_operations} 次</li>
            </ul>
        </div>

        <div class="footer">
            <p>此郵件由${siteName}自動化系統生成</p>
        </div>
    </div>
</body>
</html>`;

  await sendEmail({
    to: adminEmail,
    subject: `${siteName} - 自動文章生成報告 (${report.execution_time})`,
    html: htmlContent,
  });
};

export default handler;
