import { ReactNode } from 'react';

import { Metadata } from 'next';

import { getPageUrlByType, PageType } from '@/domains/interface';
import { metadataInfo } from '@/domains/metadatas';

import CushionCalculator from './components/CushionCalculator';

export const generateMetadata = async (): Promise<Metadata> => {
  return metadataInfo({
    pageName: PageType.CUSHION,
    currentPath: `${process.env.NEXT_PUBLIC_BASE_URL}${getPageUrlByType(PageType.CUSHION)}`,
  });
};

const Page = (): ReactNode => (
  <main className="max-w-[800px] mx-auto">
    <CushionCalculator />
  </main>
);
export default Page;
