import { ReactNode } from 'react';

import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPageUrlByType, PageType } from '@/domains/interface';
import { metadataTournamentInfo } from '@/domains/metadatas';
import { TournamentProps } from '@/domains/tournament';
import { GetTournamentReturnType } from '@/services/interfaces';
import { getTournament } from '@/services/tournament';

import TournamentEdit from './components/TournamentEdit';

type Params = Promise<{ customLink: string }>;

export const generateMetadata = async (props: { params: Params }): Promise<Metadata> => {
  const params = await props.params;
  const { customLink } = params;

  let pageName = '';
  const { tournament }: GetTournamentReturnType = await getTournament({ customLink });

  if (tournament) {
    pageName = tournament.title;
    if (!pageName) notFound();
  } else {
    notFound();
  }

  const currentPath = `${getPageUrlByType(PageType.COURTS)}/${tournament.courtCustomLink}${getPageUrlByType(PageType.TOURNAMENTS)}/${customLink}/edit`;

  return metadataTournamentInfo({
    pageName,
    currentPath,
    description: tournament?.excerpt,
    tags: tournament?.tags,
    featuredImage: tournament?.featuredImg,
    data: tournament as TournamentProps,
  });
};

const Page = (): ReactNode => (
  <main className="container mx-auto p-6">
    <TournamentEdit />
  </main>
);

export default Page;
