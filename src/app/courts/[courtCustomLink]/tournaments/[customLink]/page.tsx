import { ReactNode } from 'react';

import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { GetTournamentReturnType } from '@/services/interfaces';
import { getTournament } from '@/services/tournament';

import TournamentContent from './components/TournamentContent';

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

  return {};
  // const currentPath = `${process.env.NEXT_PUBLIC_BASE_URL}${getPageUrlByType(PageType.TOURNAMENTS)}/${customLink}`;

  // return metadataTournamentInfo({
  //   pageName,
  //   currentPath,
  //   description: tournament?.excerpt,
  //   tags: tournament?.tags,
  //   featuredImage: tournament?.featuredImg,
  //   data: tournament as TournamentProps,
  // });
};

const Page = (): ReactNode => (
  <main className="container mx-auto p-6">
    <TournamentContent />
  </main>
);

export default Page;
