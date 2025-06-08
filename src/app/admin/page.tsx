import { ReactNode } from 'react';

import { Metadata } from 'next';

import { getPageUrlByType, PageType } from '@/domains/interface';
import { metadataInfo } from '@/domains/metadatas';

import AdminContent from './components/AdminContent';

export const generateMetadata = async (): Promise<Metadata> => {
  return metadataInfo({
    pageName: PageType.ADMIN,
    currentPath: `${process.env.NEXT_PUBLIC_BASE_URL}${getPageUrlByType(PageType.ADMIN)}`,
  });
};

const Page = (): ReactNode => (
  <div className="container mx-auto p-6">
    <h1 className="text-2xl font-bold">{PageType.ADMIN}</h1>
    <AdminContent />
  </div>
);
export default Page;
