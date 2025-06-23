'use client';

import { ReactElement, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { getPageUrlByType, PageType } from '@/domains/interface';
import { TournamentProps } from '@/domains/tournament';
import { useTournamentState } from '@/features/tournaments/hooks/useTournamentState';
import DeleteTournamentContent from '@/global-components/buttons/DeleteTournamentButton';
import { TournamentFormButton, TournamentFormMode } from '@/global-components/buttons/TournamentFormButton';
import Card from '@/global-components/Card';
import ManagerCourtProtected from '@/hooks/utils/protections/components/ManagerCourtProtected';

import {
  ResponsiveWarning,
  TournamentContentFormatter,
  TournamentDisplay,
  TournamentStatusBar,
  TournamentToast,
} from './shared/TournamentShared';

interface TournamentBoardProps {
  tournamentData: TournamentProps;
  refetch: () => void;
}

const TournamentBoard = ({ tournamentData, refetch }: TournamentBoardProps): ReactElement => {
  const router = useRouter();

  const {
    currentTournament,
    toast,
    windowWidth,
    lastUpdateTime,
    isConnected,
    onlineCount,
    drawingData,
    reconnect,
    connectionQuality,
  } = useTournamentState({
    tournamentData,
    isEditMode: false,
  });

  const onDelete = useCallback(() => {
    router.push(`${getPageUrlByType(PageType.COURTS)}/${tournamentData.courtCustomLink}`);
  }, [router, tournamentData.courtCustomLink]);

  return (
    <section className="flex flex-col items-center gap-y-4">
      {/* 狀態欄 */}
      <TournamentStatusBar
        isConnected={isConnected}
        onlineCount={onlineCount}
        lastUpdateTime={lastUpdateTime}
        isEditMode={false}
        reconnect={reconnect}
        connectionQuality={connectionQuality}
      />

      {/* Toast 通知 */}
      <TournamentToast toast={toast} />

      <section className="flex flex-col items-center mt-[20px] mb-[30px] gap-4">
        <div className="flex flex-row items-center gap-4">
          <h1 className="text-2xl font-bold">{currentTournament.title}</h1>
          <ManagerCourtProtected pageId={currentTournament.customLink}>
            <TournamentFormButton mode={TournamentFormMode.Edit} tournament={tournamentData} onSuccess={refetch} />
            <DeleteTournamentContent _id={tournamentData._id} tournamentTitle={tournamentData.title} onSuccess={onDelete} />
          </ManagerCourtProtected>
        </div>
      </section>

      <TournamentDisplay
        tournamentData={currentTournament}
        isEditMode={false}
        drawingData={drawingData}
        onDrawingUpdate={undefined}
        connectionQuality={connectionQuality}
      />

      <div className="w-full">
        <ResponsiveWarning windowWidth={windowWidth} />

        {!!currentTournament.content && <Card>{<TournamentContentFormatter content={currentTournament.content} />}</Card>}
      </div>
    </section>
  );
};

export default TournamentBoard;
