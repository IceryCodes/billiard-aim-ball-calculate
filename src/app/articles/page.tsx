import { ReactNode } from 'react';

import { Metadata } from 'next';

import { getPageUrlByType, PageType } from '@/domains/interface';
import { metadataInfo } from '@/domains/metadatas';

import ArticleList from './components/ArticleList';

export const generateMetadata = async (): Promise<Metadata> => {
  return metadataInfo({
    pageName: PageType.ARTICLES,
    currentPath: `${process.env.NEXT_PUBLIC_BASE_URL}${getPageUrlByType(PageType.ARTICLES)}`,
  });
};

const Page = (): ReactNode => {
  return <ArticleList />;
};

export default Page;
