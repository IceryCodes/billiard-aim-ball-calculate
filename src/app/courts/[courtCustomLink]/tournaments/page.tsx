import { ReactNode } from 'react';

import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CourtProps } from '@/domains/court';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { metadataInfo } from '@/domains/metadatas';
import { getCourt } from '@/services/court';
import { GetCourtReturnType } from '@/services/interfaces';

import CourtTournamentList from './components/CourtTournamentList';

type Params = Promise<{ courtCustomLink: string }>;

export const generateMetadata = async (props: { params: Params }): Promise<Metadata> => {
  const params = await props.params;
  const { courtCustomLink } = params;

  let pageName = '';
  const { court }: GetCourtReturnType = await getCourt({ customLink: courtCustomLink });

  if (court) {
    pageName = `${court.title}${PageType.TOURNAMENTS}`;
  } else {
    notFound();
  }

  const currentPath = `${process.env.NEXT_PUBLIC_BASE_URL}${getPageUrlByType(PageType.COURTS)}/${courtCustomLink}${getPageUrlByType(PageType.TOURNAMENTS)}`;

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

const Page = (): ReactNode => {
  return <CourtTournamentList />;
};

export default Page;
