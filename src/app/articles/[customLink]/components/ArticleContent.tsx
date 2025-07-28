'use client';
import { ReactNode, useEffect } from 'react';

import Image from 'next/image';
import { notFound, useParams } from 'next/navigation';

import { useArticleQuery } from '@/features/articles/hooks/useArticleQuery';
import Breadcrumb from '@/global-components/Breadcrumb';
import Card from '@/global-components/Card';
import { MarkDown } from '@/global-components/markdowns/MarkDown';
import Tag from '@/global-components/tags/Tag';

import SidebarLayout from './SidebarLayout';

const ArticleContent = (): ReactNode => {
  const params = useParams();
  const paramsId: string = params?.customLink as string;

  const { data: { article } = {}, isLoading, isError } = useArticleQuery({ customLink: paramsId });

  useEffect(() => {
    if (!isLoading && !article && !isError) notFound();
  }, [isLoading, article, isError]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <span className="text-gray-500 text-lg">載入中...</span>
        </div>
      </div>
    );
  }

  if (isError) return <span>搜尋時發生錯誤</span>;
  if (!article) return <span>沒有符合的撞球相關文章</span>;

  const { _id, title, excerpt, content, featuredImg, tags } = article;
  const featuredImageUrl = `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_ARTICLE_FEATURED_FOLDER}/${featuredImg}`;

  return (
    <div className="container mx-auto p-6">
      <div className="relative w-full">
        <SidebarLayout pageId={_id.toString()}>
          <div className="flex flex-col gap-y-6">
            <Image
              src={
                featuredImg
                  ? featuredImageUrl
                  : `${process.env.NEXT_PUBLIC_BASE_URL}${process.env.NEXT_PUBLIC_FEATURED_IMAGE}`
              }
              alt={title}
              width={720}
              height={480}
              className="rounded-xl w-auto h-auto"
              blurDataURL={
                featuredImg
                  ? featuredImageUrl
                  : `${process.env.NEXT_PUBLIC_BASE_URL}${process.env.NEXT_PUBLIC_FEATURED_IMAGE}`
              }
            />
            <h1 className="text-4xl font-bold">{title}</h1>
            <Breadcrumb pageName={title} />

            <Card>
              <>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag: string) => (
                    <Tag key={tag} text={tag} />
                  ))}
                </div>
                <blockquote className="border-l-4 border-link pl-4 italic">{excerpt}</blockquote>
              </>
            </Card>

            <Card>
              <>
                <h2 className="text-xl font-bold">關於{title}</h2>
                <MarkDown content={content || `尚無關於${title}的相關資訊，歡迎補充!`} />
              </>
            </Card>
          </div>
        </SidebarLayout>
      </div>
    </div>
  );
};

export default ArticleContent;
