// pages/api/fetch-rss-news.ts

import { Collection } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';
import Parser from 'rss-parser';

import { ArticleDBProps, RSSCacheDBProps, RSSItem } from '@/domains/article';
import { getArticlesCollection, getRSSCacheCollection } from '@/lib/mongodb';
import { HttpStatus } from '@/utils/api';
import { isAdminToken } from '@/utils/token';

// Global Variables (重複使用原有的)
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

const rssParser = new Parser({
  timeout: 8000, // 縮短超時時間
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

  // 設定8秒超時
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('RSS fetch timeout')), 8000);
  });

  try {
    const fetchProcess = async () => {
      console.error(`Starting RSS fetch at: ${new Date().toISOString()}`);

      // 1. 清空舊的cache
      const cacheCollection = await getRSSCacheCollection();
      await cacheCollection.deleteMany({});
      console.error('Cleared old RSS cache');

      // 2. 獲取RSS內容
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

      // 3. 獲取現有資料進行過濾
      const sourceData = await getArticleSourceData();
      console.error(`Found ${sourceData.usedSourceUrls.length} used source URLs`);

      // 4. 過濾內容
      const filteredItems = await filterNewsContent(rssItems, sourceData);
      console.error(`Filtered to ${filteredItems.length} items`);

      // 5. 去除重複的source URL
      const uniqueItems = filteredItems.filter((item) => {
        const isUsed = sourceData.usedSourceUrls.includes(item.source_url);
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

      // 6. 儲存到RSS Cache (轉換格式為camelCase)
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
          publishedDate: item.publishedDate,
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

// 優化版的RSS獲取函數
const fetchRSSNewsOptimized = async (): Promise<RSSItem[]> => {
  const rssSources = process.env.RSS_SOURCES?.split(',') ?? [];

  if (rssSources.length === 0) {
    throw new Error('RSS_SOURCES is empty');
  }

  const allItems: RSSItem[] = [];

  // 並行處理所有RSS源，每個源3秒超時
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
            .slice(0, 10) // 每個源最多10項
            .map((item) => {
              if (!item.title || !item.link) return null;

              const content = item.contentSnippet || item.content || item.title;
              const date = item.isoDate || item.pubDate || new Date().toISOString();

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
          // RSS失敗時跳過HTML解析（太慢），直接返回空陣列
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

// 獲取文章來源資料
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

// 過濾新聞內容
const filterNewsContent = async (items: RSSItem[], sourceData: ArticleSourceData): Promise<RSSItem[]> => {
  console.error(`Starting filter with ${items.length} items`);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DAYS_RANGE);

  console.error(`Latest source date: ${sourceData.latestSourceDate ? sourceData.latestSourceDate.toISOString() : 'none'}`);

  const filteredItems = items.filter((item) => {
    const itemDate = new Date(item.published_date);

    // 日期範圍過濾
    if (itemDate < cutoffDate) {
      console.error(`Item filtered out by date range: ${item.title}`);
      return false;
    }

    // 最新來源日期過濾
    if (sourceData.latestSourceDate && itemDate < sourceData.latestSourceDate) {
      console.error(
        `Item filtered out by latest source date: ${item.title} (${itemDate.toISOString()} < ${sourceData.latestSourceDate.toISOString()})`
      );
      return false;
    }

    // 關鍵字過濾
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
