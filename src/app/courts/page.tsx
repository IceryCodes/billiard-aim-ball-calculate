import { ReactNode } from 'react';

import { Metadata } from 'next';

import { getPageUrlByType, PageType } from '@/domains/interface';
import { metadataInfo } from '@/domains/metadatas';

import CourtList from './components/CourtList';

export const generateMetadata = async (): Promise<Metadata> => {
  return metadataInfo({
    pageName: PageType.COURTS,
    currentPath: `${process.env.NEXT_PUBLIC_BASE_URL}${getPageUrlByType(PageType.COURTS)}`,
  });
};

const Page = (): ReactNode => {
  return <CourtList />;
};

export default Page;
