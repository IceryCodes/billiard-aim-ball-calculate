import { GenerateArticleDto, GetArticleDto, GetArticlesDto } from '@/domains/article';
import { apiOrigin, logApiError } from '@/utils/api';

import { GenerateArticleReturnType, GetArticleReturnType, GetArticlesReturnType } from './interfaces';

export const articleQueryKeys = {
  getArticle: 'getArticle',
  getArticles: 'getArticles',
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

export const generateArticle = async (generateData: GenerateArticleDto): Promise<GenerateArticleReturnType> => {
  try {
    const { data } = await apiOrigin.post(`/generate-articles`, generateData);

    return {
      message: data.message,
    };
  } catch (error) {
    const message = '新增撞球相關文章失敗!';
    logApiError({ error, message });

    return {
      message,
    };
  }
};
