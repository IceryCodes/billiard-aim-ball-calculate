import { ReactNode } from 'react';

import { Metadata } from 'next';

import RegisterContent from '@/app/register/components/RegisterContent';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { metadataInfo } from '@/domains/metadatas';

export const generateMetadata = async (): Promise<Metadata> => {
  return metadataInfo({
    pageName: PageType.REGISTER,
    currentPath: `${process.env.NEXT_PUBLIC_BASE_URL}${getPageUrlByType(PageType.REGISTER)}`,
  });
};

const Page = (): ReactNode => (
  <div className={`mt-52 md:mt-0 md:h-content flex items-center`}>
    <RegisterContent />
  </div>
);
export default Page;
