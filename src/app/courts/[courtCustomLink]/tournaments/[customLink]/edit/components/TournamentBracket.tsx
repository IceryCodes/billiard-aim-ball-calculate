'use client';

import { ReactElement } from 'react';

import Link from 'next/link';

import { useAuth } from '@/contexts/AuthContext';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { TournamentProps, UpdateTournamentDto } from '@/domains/tournament';
import { useTournamentState } from '@/features/tournaments/hooks/useTournamentState';
import { TournamentForm, TournamentFormMode } from '@/global-components/forms/TournamentForm';
import ManagerCourtProtected from '@/hooks/utils/protections/components/ManagerCourtProtected';
import { TournamentUpdateReturnType } from '@/services/interfaces';

import {
  ResponsiveWarning,
  TournamentControls,
  TournamentDisplay,
  TournamentToast,
} from '../../components/shared/TournamentShared';

interface TournamentBracketProps {
  tournamentData: TournamentProps;
  updateTournament: (tournament: UpdateTournamentDto) => Promise<TournamentUpdateReturnType>;
  refetchTournament: () => void;
}

const TournamentBracket = ({
  tournamentData,
  updateTournament,
  refetchTournament,
}: TournamentBracketProps): ReactElement => {
  const { isLoading: authLoading } = useAuth();

  const {
    currentTournament,
    toast,
    windowWidth,
    isConnected,
    onlineCount,
    handlePlayerNameChange,
    handleMatchUpdate,
    handleTestBroadcast,
    drawingData,
    handleDrawingUpdate,
    connectionQuality,
  } = useTournamentState({
    tournamentData,
    updateTournament,
    refetchTournament,
    isEditMode: true,
  });

  if (authLoading) return <span>載入中...</span>;

  return (
    <section className="flex flex-col items-center gap-y-4">
      {/* Toast 通知 */}
      <TournamentToast toast={toast} />

      <section className="flex flex-col items-center mt-[20px] gap-4">
        <div className="flex flex-row items-center gap-4">
          <Link
            title={tournamentData.title}
            href={`${getPageUrlByType(PageType.COURTS)}/${tournamentData.courtCustomLink}${getPageUrlByType(PageType.TOURNAMENTS)}/${tournamentData.customLink}`}
          >
            <h1 className="text-2xl font-bold">{tournamentData.title}</h1>
          </Link>
          <ManagerCourtProtected pageId={tournamentData.court}>
            <TournamentForm mode={TournamentFormMode.Edit} tournament={tournamentData} onSuccess={refetchTournament} />
          </ManagerCourtProtected>
        </div>
      </section>

      <div className="w-full flex flex-col gap-y-4">
        <ResponsiveWarning windowWidth={windowWidth} />

        {/* 賽程表顯示 */}
        <TournamentDisplay
          tournamentData={currentTournament}
          onMatchUpdate={handleMatchUpdate}
          isEditMode={true}
          drawingData={drawingData}
          onDrawingUpdate={handleDrawingUpdate}
          onPlayerNameEdit={handlePlayerNameChange}
          connectionQuality={connectionQuality}
        />
      </div>

      {/* 編輯控制面板 */}
      <TournamentControls
        isConnected={isConnected}
        onlineCount={onlineCount}
        onTestBroadcast={handleTestBroadcast}
        connectionQuality={connectionQuality}
      />
    </section>
  );
};

export default TournamentBracket;
