import { ReactNode } from 'react';

import { Metadata } from 'next';

import { getPageUrlByType, PageType } from '@/domains/interface';
import { metadataInfo } from '@/domains/metadatas';

import AimCalculation from './components/AimCalculation';

export const generateMetadata = async (): Promise<Metadata> => {
  return metadataInfo({
    pageName: PageType.AIM,
    currentPath: `${process.env.NEXT_PUBLIC_BASE_URL}${getPageUrlByType(PageType.AIM)}`,
  });
};

const Page = (): ReactNode => (
  <main className="max-w-[800px] mx-auto">
    <AimCalculation />
  </main>
);
export default Page;
