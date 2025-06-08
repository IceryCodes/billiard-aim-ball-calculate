'use client';
import { ReactNode, useEffect } from 'react';

import { notFound, useParams } from 'next/navigation';

import { useTournamentQuery } from '@/features/tournaments/hooks/useTournamentQuery';

import TournamentBoard from './TournamentBoard';

const TournamentContent = (): ReactNode => {
  const params = useParams();
  const paramsId: string = params?.customLink as string;

  const {
    data: { tournament } = {},
    isLoading,
    isError,
    // refetch: refetchTournament,
  } = useTournamentQuery({ customLink: paramsId });

  useEffect(() => {
    if (!isLoading && !tournament && !isError) notFound();
  }, [isLoading, tournament, isError]);

  if (isError) return <span>搜尋時發生錯誤</span>;
  if (!tournament) return <span>沒有符合的球場賽程資料</span>;

  return (
    <div className="container mx-auto p-6">
      <div className="relative w-full">
        <TournamentBoard tournamentData={tournament} />
      </div>
    </div>
  );
};

export default TournamentContent;
