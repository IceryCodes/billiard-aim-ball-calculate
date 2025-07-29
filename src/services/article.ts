import { GenerateFromCacheDto, GetArticleDto, GetArticlesDto } from '@/domains/article';
import { apiOrigin, logApiError } from '@/utils/api';

import { FetchRSSReturnType, GenerateFromCacheReturnType, GetArticleReturnType, GetArticlesReturnType } from './interfaces';

export const articleQueryKeys = {
  getArticle: 'getArticle',
  getArticles: 'getArticles',
  fetchRSS: 'fetchRSS',
  generateFromCache: 'generateFromCache',
} as const;

export const getArticle = async ({ customLink }: GetArticleDto): Promise<GetArticleReturnType> => {
  const encodedCustomLink = decodeURIComponent(customLink);

  try {
    const { data } = await apiOrigin.get('/get-article', {
      params: { customLink: encodedCustomLink },
    });

    return data;
  } catch (error) {
    const message = '搜尋撞球相關文章失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

export const getArticles = async ({ page = 1, limit = 10 }: GetArticlesDto): Promise<GetArticlesReturnType> => {
  try {
    const { data } = await apiOrigin.get('/get-articles', {
      params: { page, limit },
    });

    return {
      articles: data.articles.length ? data.articles : [],
      total: data.total ? data.total : 0,
      message: 'Success',
    };
  } catch (error) {
    const message = '搜尋撞球相關文章失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};

// 第一步：獲取RSS並快取
export const fetchRSSNews = async (): Promise<FetchRSSReturnType> => {
  try {
    const { data } = await apiOrigin.post('/fetch-rss-news');

    return {
      message: data.message,
      cachedCount: data.cachedCount,
      executionTime: data.executionTime,
      items: data.items || [],
    };
  } catch (error) {
    const message = 'RSS新聞獲取失敗!';
    logApiError({ error, message });

    return {
      message,
      cachedCount: 0,
      executionTime: 0,
      items: [],
    };
  }
};

// 第二步：從快取生成文章（支援選擇新聞）
export const generateArticlesFromCache = async (params?: GenerateFromCacheDto): Promise<GenerateFromCacheReturnType> => {
  try {
    const { data } = await apiOrigin.post('/generate-articles-from-cache', {
      maxArticles: params?.maxArticles || 1,
      selectedItems: params?.selectedItems || [],
    });

    return {
      message: data.message,
      executionTime: data.executionTime,
      report: data.report,
    };
  } catch (error) {
    const message = '從快取生成文章失敗!';
    logApiError({ error, message });

    return {
      message,
      executionTime: 0,
    };
  }
};

// 組合函數：執行完整的兩步驟流程
export const generateArticlesTwoStep = async (): Promise<GenerateFromCacheReturnType> => {
  try {
    // 第一步：獲取RSS
    const fetchResult = await fetchRSSNews();

    // 檢查第一步是否有錯誤（根據cachedCount判斷）
    if (fetchResult.cachedCount === 0) {
      return {
        message: fetchResult.message,
        executionTime: fetchResult.executionTime,
      };
    }

    // 第二步：生成文章（不傳selectedItems，使用第一篇）
    try {
      const generateResult = await generateArticlesFromCache();

      // 合併執行時間
      return {
        message: generateResult.message,
        executionTime: fetchResult.executionTime + generateResult.executionTime,
        report: generateResult.report,
      };
    } catch (generateError) {
      // 第二步失敗的特殊處理
      const message = '文章生成階段失敗!';
      logApiError({ error: generateError, message });

      return {
        message,
        executionTime: fetchResult.executionTime,
      };
    }
  } catch (fetchError) {
    // 第一步失敗的處理
    const message = 'RSS獲取階段失敗!';
    logApiError({ error: fetchError, message });

    return {
      message,
      executionTime: 0,
    };
  }
};
