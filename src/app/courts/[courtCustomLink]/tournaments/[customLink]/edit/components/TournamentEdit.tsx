'use client';
import { ReactNode } from 'react';

import { useParams } from 'next/navigation';

import { useTournamentQuery } from '@/features/tournaments/hooks/useTournamentQuery';
import { useUpdateTournamentMutation } from '@/features/tournaments/hooks/useUpdateTournamentMutation';
import useTournamentProtected from '@/hooks/utils/protections/routes/useTournamentProtected';

import TournamentBracket from './TournamentBracket';

const TournamentEdit = (): ReactNode => {
  const params = useParams();
  const paramsId: string = params?.customLink as string;

  useTournamentProtected();

  const { data: { tournament } = {}, isError, refetch: refetchTournament } = useTournamentQuery({ customLink: paramsId });
  const { mutateAsync: updateTournament } = useUpdateTournamentMutation();

  if (isError) return <span>搜尋時發生錯誤</span>;
  if (!tournament) return <span>沒有符合的球場賽程資料</span>;

  return (
    <TournamentBracket
      tournamentData={tournament}
      updateTournament={updateTournament}
      refetchTournament={refetchTournament}
    />
  );
};

export default TournamentEdit;
