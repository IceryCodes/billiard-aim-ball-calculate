import { ReactNode } from 'react';

import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CourtProps } from '@/domains/court';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { metadataInfo } from '@/domains/metadatas';
import { getCourt } from '@/services/court';
import { GetCourtReturnType } from '@/services/interfaces';

import CourtContent from './components/CourtContent';

type Params = Promise<{ courtCustomLink: string }>;

// ISR:第一次被請求時產生、之後快取 1 天(球場資料幾乎不會變)。
// generateStaticParams 回空陣列 = build 時不預先產生,但讓這個動態路由走 ISR 而不是每次都重跑。
export const revalidate = 86400;
export const maxDuration = 10;
export const generateStaticParams = async (): Promise<{ courtCustomLink: string }[]> => [];

export const generateMetadata = async (props: { params: Params }): Promise<Metadata> => {
  const params = await props.params;
  const { courtCustomLink } = params;

  let pageName = '';
  const { court }: GetCourtReturnType = await getCourt({ customLink: courtCustomLink });

  if (court) {
    pageName = court.title;
  } else {
    notFound();
  }

  const currentPath = `${process.env.NEXT_PUBLIC_BASE_URL}${getPageUrlByType(PageType.COURTS)}/${courtCustomLink}`;

  return metadataInfo({
    pageName,
    currentPath,
    description: court?.excerpt,
    keywords: court?.keywords,
    email: court?.email,
    featuredImage: court?.featuredImg,
    data: court as CourtProps,
  });
};

const Page = (): ReactNode => (
  <div className="container mx-auto p-6">
    <CourtContent />
  </div>
);

export default Page;
