import { ReactNode } from 'react';

import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPageUrlByType, PageType } from '@/domains/interface';
import { metadataInfo } from '@/domains/metadatas';
import { PlayerProps } from '@/domains/player';
import { GetPlayerReturnType } from '@/services/interfaces';
import { getPlayer } from '@/services/player';

import PlayerContent from './components/PlayerContent';

type Params = Promise<{ playerCustomLink: string }>;

export const generateMetadata = async (props: { params: Params }): Promise<Metadata> => {
  const params = await props.params;
  const { playerCustomLink } = params;

  let pageName = '';
  const { player }: GetPlayerReturnType = await getPlayer({ customLink: playerCustomLink });

  if (player) {
    pageName = player.title;
  } else {
    console.log('Player not found', player);
    notFound();
  }

  const currentPath = `${process.env.NEXT_PUBLIC_BASE_URL}${getPageUrlByType(PageType.PLAYERS)}/${playerCustomLink}`;

  return metadataInfo({
    pageName,
    currentPath,
    description: player?.excerpt,
    keywords: player?.keywords,
    email: player?.email,
    featuredImage: player?.featuredImg,
    data: player as PlayerProps,
  });
};

const Page = (): ReactNode => (
  <div className="container mx-auto p-6">
    <PlayerContent />
  </div>
);

export default Page;
