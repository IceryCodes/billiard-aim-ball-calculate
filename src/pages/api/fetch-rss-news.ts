import moment from 'moment';
import { Collection } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';
import Parser from 'rss-parser';

import { ArticleDBProps, RSSCacheDBProps, RSSItem } from '@/domains/article';
import { getArticlesCollection, getRSSCacheCollection } from '@/lib/mongodb';
import { HttpStatus } from '@/utils/api';
import { filterNewsContent } from '@/utils/generateArticle';
import { isAdminToken } from '@/utils/token';

interface CategoryItem {
  _?: string;
  name?: string;
  text?: string;
}

type RSSCategoryType = string | CategoryItem;

const rssParser = new Parser({
  timeout: 8000,
  customFields: {
    item: ['description', 'summary', 'dc:creator'],
  },
});

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(HttpStatus.MethodNotAllowed).json({
      message: `Method ${req.method} not allowed`,
    });
  }

  try {
    const isAdmin = await isAdminToken(req.headers.authorization);
    if (!isAdmin) {
      return res.status(HttpStatus.Forbidden).json({
        message: 'Insufficient permissions',
      });
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(HttpStatus.Unauthorized).json({
      message: 'Invalid token',
    });
  }

  const startTime = Date.now();

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('RSS fetch timeout')), 8000);
  });

  try {
    const fetchProcess = async () => {
      console.error(`Starting RSS fetch at: ${moment().toISOString()}`);

      const cacheCollection = await getRSSCacheCollection();
      await cacheCollection.deleteMany({});
      console.error('Cleared old RSS cache');

      const rssItems = await fetchRSSNewsOptimized();
      console.error(`Fetched ${rssItems.length} RSS items`);

      if (rssItems.length === 0) {
        const executionTime = Date.now() - startTime;
        return res.status(HttpStatus.Ok).json({
          message: '未獲取到任何RSS內容',
          cachedCount: 0,
          executionTime,
          items: [],
        });
      }

      const usedSourceUrls = await getUsedSourceUrls();
      console.error(`Found ${usedSourceUrls.length} used source URLs`);

      const filteredItems = filterNewsContent(rssItems);
      console.error(`Filtered to ${filteredItems.length} items`);

      const uniqueItems = filteredItems.filter((item) => {
        const isUsed = usedSourceUrls.includes(item.source_url);
        if (isUsed) {
          console.error(`Skipping duplicate source: ${item.title}`);
        }
        return !isUsed;
      });

      console.error(`After removing duplicates: ${uniqueItems.length} items remaining`);

      if (uniqueItems.length === 0) {
        const executionTime = Date.now() - startTime;
        return res.status(HttpStatus.Ok).json({
          message: '過濾後無新文章可處理',
          cachedCount: 0,
          executionTime,
          items: [],
        });
      }

      const cacheItems: Omit<RSSCacheDBProps, '_id'>[] = uniqueItems.map((item) => ({
        title: item.title,
        content: item.content,
        publishedDate: item.published_date,
        sourceUrl: item.source_url,
        category: item.category,
        cachedAt: new Date(),
      }));

      await cacheCollection.insertMany(cacheItems);
      console.error(`Cached ${cacheItems.length} items`);

      const executionTime = Date.now() - startTime;
      return res.status(HttpStatus.Ok).json({
        message: `成功快取 ${cacheItems.length} 篇新聞`,
        cachedCount: cacheItems.length,
        executionTime,
        items: cacheItems.map((item) => ({
          title: item.title,
          sourceUrl: item.sourceUrl,
          publishedDate: moment(item.publishedDate).toDate(),
        })),
      });
    };

    await Promise.race([fetchProcess(), timeoutPromise]);
  } catch (error) {
    console.error('RSS fetch failed:', error);
    return res.status(HttpStatus.InternalServerError).json({
      message: `RSS fetch error: ${error}`,
      cachedCount: 0,
      executionTime: Date.now() - startTime,
      items: [],
    });
  }
};

const fetchRSSNewsOptimized = async (): Promise<RSSItem[]> => {
  const rssSources = process.env.RSS_SOURCES?.split(',') ?? [];

  if (rssSources.length === 0) {
    throw new Error('RSS_SOURCES is empty');
  }

  const allItems: RSSItem[] = [];
  const RSS_TIMEOUT_PER_SOURCE = 3000;

  const rssPromises = rssSources.map(async (rssUrl) => {
    const timeoutPromise = new Promise<RSSItem[]>((_, reject) => {
      setTimeout(() => reject(new Error(`RSS timeout for ${rssUrl}`)), RSS_TIMEOUT_PER_SOURCE);
    });

    const fetchPromise = async (): Promise<RSSItem[]> => {
      try {
        console.error(`Processing RSS source: ${rssUrl}`);

        let items: RSSItem[] = [];

        try {
          const feed = await rssParser.parseURL(rssUrl);
          items = feed.items
            .slice(0, 10)
            .map((item) => {
              if (!item.title || !item.link) return null;

              const content = item.contentSnippet || item.content || item.title;
              const date = item.isoDate || item.pubDate || moment().toISOString();

              let category = '一般新聞';
              if (item.categories && Array.isArray(item.categories)) {
                try {
                  category =
                    item.categories
                      .map((cat: RSSCategoryType) => {
                        if (typeof cat === 'string') return cat;
                        if (typeof cat === 'object' && cat !== null) {
                          const categoryObj = cat;
                          if ('_' in categoryObj && typeof categoryObj._ === 'string') return categoryObj._;
                          if ('name' in categoryObj && typeof categoryObj.name === 'string') return categoryObj.name;
                          if ('text' in categoryObj && typeof categoryObj.text === 'string') return categoryObj.text;
                        }
                        return '';
                      })
                      .filter((cat): cat is string => Boolean(cat))
                      .join(',') || '一般新聞';
                } catch {
                  category = '一般新聞';
                }
              }

              return {
                title: String(item.title),
                content: String(content),
                published_date: String(date),
                source_url: String(item.link),
                category,
              };
            })
            .filter((item): item is RSSItem => item !== null);
        } catch (rssError) {
          console.error(`RSS parsing failed for ${rssUrl}, skipping HTML parsing to save time`);
          return [];
        }

        console.error(`Successfully processed ${items.length} items from ${rssUrl}`);
        return items;
      } catch (error) {
        console.error(`Failed to process source ${rssUrl}:`, error);
        return [];
      }
    };

    return Promise.race([fetchPromise(), timeoutPromise]);
  });

  const results = await Promise.allSettled(rssPromises);

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    } else {
      console.error(`RSS source ${rssSources[index]} failed:`, result.reason);
    }
  });

  console.error(`Total RSS items collected: ${allItems.length}`);
  return allItems;
};

const getUsedSourceUrls = async (): Promise<string[]> => {
  const articlesCollection: Collection<Omit<ArticleDBProps, '_id'>> = await getArticlesCollection();

  const articles = await articlesCollection
    .find({ sourceUrl: { $exists: true } })
    .project({ sourceUrl: 1 })
    .toArray();

  return articles.map((article) => article.sourceUrl).filter((url): url is string => Boolean(url));
};

export default handler;
