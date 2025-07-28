import { ObjectId } from 'mongodb';

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

export interface ArticleProps {
  _id: string;
  title: string;
  author: string;
  excerpt: string;
  content: string;
  featuredImg: string;
  customLink: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ArticleDBProps extends Omit<ArticleProps, '_id'> {
  _id: ObjectId;
}
