'use client';
import { ReactNode } from 'react';

import { ArticleProps } from '@/domains/article';
import { PageType } from '@/domains/interface';
import { useArticlesQuery } from '@/features/articles/hooks/useArticlesQuery';

import ArticleListItemCard from './ArticleListItemCard';

const limit = 30;

const ArticleList = (): ReactNode => {
  const {
    data: { articles = [] } = {},
    isLoading,
    isError,
  } = useArticlesQuery({
    page: 1,
    limit,
  });

  return (
    <div className="container mx-auto p-6 flex flex-col gap-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">{PageType.ARTICLES}</h1>
      </div>

      {/* Loading overlay */}
      <div className="relative w-full min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 flex justify-center items-center bg-backgroundLight">
            <span className="text-gray-500 text-lg">搜尋中...</span>
          </div>
        )}
        {isError && <span>搜尋時發生錯誤</span>}

        {/* Hospital list */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {!articles.length && <label>沒有符合的撞球相關文章</label>}
          {articles.map(({ _id, title, featuredImg, excerpt, customLink, tags }: ArticleProps) => {
            const featuredImageUrl = featuredImg
              ? `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_ARTICLE_FEATURED_FOLDER}/${featuredImg}`
              : `${process.env.NEXT_PUBLIC_BASE_URL}${process.env.NEXT_PUBLIC_FEATURED_IMAGE}`;

            return (
              <ArticleListItemCard
                key={_id}
                image={featuredImageUrl}
                title={title}
                excerpt={excerpt}
                customLink={customLink}
                tags={tags}
              />
            );
          })}
        </section>
      </div>
    </div>
  );
};

export default ArticleList;
