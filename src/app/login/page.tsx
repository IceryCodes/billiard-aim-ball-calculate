import { ReactNode } from 'react';

import { Metadata } from 'next';

import { getPageUrlByType, PageType } from '@/domains/interface';
import { metadataInfo } from '@/domains/metadatas';

import LoginContent from './components/LoginContent';

export const generateMetadata = async (): Promise<Metadata> => {
  return metadataInfo({
    pageName: PageType.LOGIN,
    currentPath: `${process.env.NEXT_PUBLIC_BASE_URL}${getPageUrlByType(PageType.LOGIN)}`,
  });
};

const Page = (): ReactNode => (
  <div className={`mt-52 md:mt-0 md:h-content flex items-center`}>
    <LoginContent />
  </div>
);
export default Page;
