import { ObjectId } from 'mongodb';

// 基本文章相關DTO
export interface GetArticleDto {
  customLink: string;
}

export interface GetArticlesDto {
  page?: number;
  limit?: number;
}

export interface GenerateArticleDto {
  maxArticles: number;
}

// 新增：生成文章時的選擇項目DTO
export interface GenerateFromCacheDto {
  selectedItems: string[]; // 選中的新聞sourceUrl數組
  maxArticles?: number;
}

// 文章相關介面
export interface ArticleProps {
  _id: string;
  title: string;
  author: string;
  excerpt: string;
  content: string;
  featuredImg: string;
  customLink: string;
  tags: string[];
  sourceDate?: Date;
  sourceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArticleDBProps extends Omit<ArticleProps, '_id'> {
  _id: ObjectId;
}

// RSS Cache 相關類型（camelCase）
export interface RSSCacheItem {
  title: string;
  content: string;
  publishedDate: string;
  sourceUrl: string;
  category: string;
  cachedAt: Date;
}

export interface RSSCacheDBProps extends RSSCacheItem {
  _id: ObjectId;
}

// 原有的 RSSItem 介面（為了兼容性保留，使用snake_case）
export interface RSSItem {
  title: string;
  content: string;
  published_date: string;
  source_url: string;
  category: string;
}

// 處理過的文章介面
export interface ProcessedArticle {
  title: string;
  description: string;
  tags: string[];
  content: string;
  category: string;
  sourceUrl: string;
  sourceDate: Date;
}

// 執行報告介面
export interface ExecutionReport {
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

// API 回傳類型
export interface FetchRSSReturnType {
  message: string;
  cachedCount: number;
  executionTime: number;
  items?: {
    title: string;
    sourceUrl: string;
    publishedDate: string;
  }[];
}
