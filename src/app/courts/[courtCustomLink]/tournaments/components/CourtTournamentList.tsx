'use client';

import { ReactNode } from 'react';

import { useParams } from 'next/navigation';

import TournamentList from '@/app/tournaments/components/TournamentList';
import { useCourtQuery } from '@/features/courts/hooks/useCourtQuery';

const CourtTournamentList = (): ReactNode => {
  const params = useParams();
  const courtCustomLink: string = params?.courtCustomLink as string;

  const { data: { court } = {}, isLoading, isError } = useCourtQuery({ customLink: courtCustomLink });

  if (isLoading || isError || !court) return <span>載入中...</span>;

  return <TournamentList courtId={court?._id} courtName={court?.title} />;
};

export default CourtTournamentList;
