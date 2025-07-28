import { ReactNode } from 'react';

import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ArticleProps } from '@/domains/article';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { metadataArticleInfo } from '@/domains/metadatas';
import { getArticle } from '@/services/article';
import { GetArticleReturnType } from '@/services/interfaces';

import ArticleContent from './components/ArticleContent';

type Params = Promise<{ customLink: string }>;

export const generateMetadata = async (props: { params: Params }): Promise<Metadata> => {
  const params = await props.params;
  const { customLink } = params;

  let pageName = '';
  const { article }: GetArticleReturnType = await getArticle({ customLink });

  if (article) {
    pageName = article.title;
  } else {
    notFound();
  }
  const currentPath = `${process.env.NEXT_PUBLIC_BASE_URL}${getPageUrlByType(PageType.ARTICLES)}/${customLink}`;

  return metadataArticleInfo({
    pageName,
    currentPath,
    description: article?.excerpt,
    tags: article?.tags,
    featuredImage: article?.featuredImg,
    data: article as ArticleProps,
  });
};

const Page = (): ReactNode => (
  <div className="container mx-auto p-6">
    <ArticleContent />
  </div>
);

export default Page;
