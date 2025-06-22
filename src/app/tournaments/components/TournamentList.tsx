'use client';
import { ReactNode } from 'react';

import { PageType } from '@/domains/interface';
import { TournamentProps } from '@/domains/tournament';
import { useTournamentsQuery } from '@/features/tournaments/hooks/useTournamentsQuery';
import { TournamentForm, TournamentFormMode } from '@/global-components/forms/TournamentForm';
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
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">{`${courtName}${PageType.TOURNAMENTS}`}</h1>
      </div>
      <ManagerCourtProtected pageId={courtId}>
        <TournamentForm mode={TournamentFormMode.Create} onSuccess={refetch} />
      </ManagerCourtProtected>

      {/* Loading overlay */}
      <div className="relative w-full min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 flex justify-center items-center bg-backgroundLight">
            <span className="text-gray-500 text-lg">搜尋中...</span>
          </div>
        )}
        {isError && <span>搜尋時發生錯誤</span>}

        {/* Hospital list */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {!tournaments.length && <label>沒有符合的球場賽程資料</label>}
          {tournaments.map(({ _id, title, featuredImg, excerpt, courtCustomLink, customLink, tags }: TournamentProps) => (
            <TournamentListItemCard
              key={_id.toString()}
              image={featuredImg ? featuredImg : process.env.NEXT_PUBLIC_FEATURED_IMAGE}
              title={title}
              excerpt={excerpt}
              courtCustomLink={courtCustomLink}
              customLink={customLink}
              tags={tags}
            />
          ))}
        </section>
      </div>
    </div>
  );
};

export default TournamentList;
