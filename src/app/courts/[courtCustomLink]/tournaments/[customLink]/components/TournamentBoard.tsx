'use client';

import { ReactElement } from 'react';

import { TournamentProps } from '@/domains/tournament';
import { useTournamentState } from '@/features/tournaments/hooks/useTournamentState';

import ResponsiveTournamentDisplay from '../edit/components/ResponsiveTournamentDisplay';
import { ResponsiveWarning, TournamentStatusBar, TournamentToast } from '../edit/components/TournamentShared';

interface TournamentBoardProps {
  tournamentData: TournamentProps;
  refetch: () => void;
}

const TournamentBoard = ({ tournamentData, refetch }: TournamentBoardProps): ReactElement => {
  const { currentTournament, toast, windowWidth, lastUpdateTime, isConnected, onlineCount, reconnect, connectionQuality } =
    useTournamentState({
      tournamentData,
      isEditMode: false,
    });

  return (
    <section className="flex flex-col items-center gap-y-4">
      {/* Toast 通知 */}
      <TournamentToast toast={toast} />

      <ResponsiveTournamentDisplay
        tournamentData={currentTournament}
        isEditMode={false}
        connectionQuality={connectionQuality}
      />

      {/* 狀態欄 */}
      <TournamentStatusBar
        isConnected={isConnected}
        onlineCount={onlineCount}
        lastUpdateTime={lastUpdateTime}
        isEditMode={false}
        reconnect={reconnect}
        connectionQuality={connectionQuality}
        tournament={currentTournament}
        refetch={refetch}
      />

      <div className="w-full">
        <ResponsiveWarning windowWidth={windowWidth} />
      </div>
    </section>
  );
};

export default TournamentBoard;
