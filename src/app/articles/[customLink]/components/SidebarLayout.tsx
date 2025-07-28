import { ReactNode } from 'react';

import { useRouter } from 'next/navigation';

import ArticleListItemCard from '@/app/articles/components/ArticleListItemCard';
import { ArticleProps } from '@/domains/article';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { useArticlesQuery } from '@/features/articles/hooks/useArticlesQuery';
import { Button, ButtonStyleType } from '@/global-components/buttons/Button';
import Card from '@/global-components/Card';

interface SidebarLayoutProps {
  pageId: string;
  children: ReactNode;
}

const SidebarLayout = ({ pageId, children }: SidebarLayoutProps) => {
  const router = useRouter();

  const {
    data: { articles = [] } = {},
    isLoading,
    isError,
  } = useArticlesQuery({
    page: 1,
    limit: 6,
  });

  return (
    <div className="flex gap-x-8">
      <div className=" w-full md:w-2/3">{children}</div>
      <div className="w-1/3 flex-col hidden md:flex">
        <Card>
          <label className="text-xl font-bold">其他撞球相關文章</label>
          <Button
            text="返回列表"
            buttonStyle={ButtonStyleType.Disabled}
            onClick={() => router.push(getPageUrlByType(PageType.ARTICLES))}
            className="rounded w-full"
          />
        </Card>

        <div className="relative w-full">
          {isLoading && (
            <div className="absolute inset-0 flex justify-center items-center bg-backgroundLight">
              <span className="text-gray-500 text-lg">搜尋中...</span>
            </div>
          )}
          {isError && <span>搜尋撞球相關文章出現錯誤</span>}

          {/* Article list */}
          <div className="grid grid-cols-1 gap-4 p-4">
            {!articles.length && <label>沒有符合撞球相關文章</label>}
            {articles
              .filter(({ _id }: ArticleProps) => _id !== pageId)
              .map(({ _id, title, excerpt, customLink, tags, featuredImg }: ArticleProps) => {
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarLayout;
