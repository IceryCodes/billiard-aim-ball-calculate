'use client';
import { ReactNode } from 'react';

import { PageType } from '@/domains/interface';
import { TournamentProps } from '@/domains/tournament';
import { useTournamentsQuery } from '@/features/tournaments/hooks/useTournamentsQuery';
import { TournamentFormButton, TournamentFormMode } from '@/global-components/buttons/TournamentFormButton';
import ManagerCourtProtected from '@/hooks/utils/protections/components/ManagerCourtProtected';

import TournamentListItemCard from './TournamentListItemCard';

const limit = 30;

interface TournamentListProps {
  courtId?: string;
  courtName?: string;
}

const TournamentList = ({ courtId = '', courtName = '' }: TournamentListProps): ReactNode => {
  const {
    data: { tournaments = [] } = {},
    isLoading,
    isError,
    refetch,
  } = useTournamentsQuery({
    court: courtId,
    page: 1,
    limit,
  });

  return (
    <div className="container mx-auto p-6 flex flex-col gap-y-4">
      <div className="flex items-center gap-x-4">
        <h1 className="text-2xl font-bold">{`${courtName}${PageType.TOURNAMENTS}`}</h1>
        {!!courtId && (
          <ManagerCourtProtected pageId={courtId}>
            <TournamentFormButton mode={TournamentFormMode.Create} onSuccess={refetch} />
          </ManagerCourtProtected>
        )}
      </div>

      {/* Loading overlay */}
      <div className="relative w-full min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 flex justify-center items-center bg-backgroundLight">
            <span className="text-gray-500 text-lg">搜尋中...</span>
          </div>
        )}
        {isError && <span>搜尋時發生錯誤</span>}

        {/* Hospital list */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!tournaments.length && <label>沒有符合的球場賽程資料</label>}
          {tournaments.map((tournament: TournamentProps) => (
            <TournamentListItemCard
              key={tournament._id}
              image={
                tournament.featuredImg
                  ? `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_FEATURED_IMAGE_FOLDER}/${tournament.featuredImg}`
                  : process.env.NEXT_PUBLIC_FEATURED_IMAGE
              }
              tournament={tournament}
            />
          ))}
        </section>
      </div>
    </div>
  );
};

export default TournamentList;
