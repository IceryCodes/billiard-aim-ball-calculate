import { ReactNode } from 'react';

import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CourtProps } from '@/domains/court';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { metadataInfo } from '@/domains/metadatas';
import { getCourt } from '@/services/court';
import { GetCourtReturnType } from '@/services/interfaces';

import CourtContent from './components/CourtContent';

type Params = Promise<{ customLink: string }>;

export const generateMetadata = async (props: { params: Params }): Promise<Metadata> => {
  const params = await props.params;
  const { customLink } = params;

  let pageName = '';
  const { court }: GetCourtReturnType = await getCourt({ customLink });

  if (court) {
    pageName = court.title;
  } else {
    notFound();
  }

  const currentPath = `${process.env.NEXT_PUBLIC_BASE_URL}${getPageUrlByType(PageType.COURTS)}/${customLink}`;

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
