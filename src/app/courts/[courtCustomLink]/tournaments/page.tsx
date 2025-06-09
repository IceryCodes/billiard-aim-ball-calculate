import { ReactNode } from 'react';

import { Metadata } from 'next';

import { getPageUrlByType, PageType } from '@/domains/interface';
import { metadataInfo } from '@/domains/metadatas';

import CourtTournamentList from './components/CourtTournamentList';

export const generateMetadata = async (): Promise<Metadata> => {
  return metadataInfo({
    pageName: PageType.TOURNAMENTS,
    currentPath: `${process.env.NEXT_PUBLIC_BASE_URL}${getPageUrlByType(PageType.TOURNAMENTS)}`,
  });
};

const Page = (): ReactNode => {
  return <CourtTournamentList />;
};

export default Page;
