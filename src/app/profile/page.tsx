import { ReactNode } from 'react';

import { Metadata } from 'next';

import { getPageUrlByType, PageType } from '@/domains/interface';
import { metadataInfo } from '@/domains/metadatas';

import ProfileContent from './components/ProfileContent';

export const generateMetadata = async (): Promise<Metadata> => {
  return metadataInfo({
    pageName: PageType.PROFILE,
    currentPath: `${process.env.NEXT_PUBLIC_BASE_URL}${getPageUrlByType(PageType.PROFILE)}`,
  });
};

const Page = (): ReactNode => (
  <div className="container mx-auto p-6">
    <ProfileContent />
  </div>
);
export default Page;
