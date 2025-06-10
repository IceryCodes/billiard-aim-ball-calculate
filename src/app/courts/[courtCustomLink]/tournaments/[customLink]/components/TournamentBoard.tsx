'use client';

import { ReactElement } from 'react';

import { useRouter } from 'next/navigation';

import { getPageUrlByType, PageType } from '@/domains/interface';
import { TournamentProps } from '@/domains/tournament';
import { useTournamentState } from '@/features/tournaments/hooks/useTournamentState';
import { Button, ButtonStyleType } from '@/global-components/buttons/Button';
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
}

const TournamentBoard = ({ tournamentData }: TournamentBoardProps): ReactElement => {
  const router = useRouter();

  const { currentTournament, toast, windowWidth, lastUpdateTime, isConnected, onlineCount, reconnect } = useTournamentState({
    tournamentData,
    isEditMode: false,
  });

  return (
    <section className="flex flex-col items-center gap-y-4">
      {/* 狀態欄 */}
      <TournamentStatusBar
        isConnected={isConnected}
        onlineCount={onlineCount}
        lastUpdateTime={lastUpdateTime}
        isEditMode={false}
        reconnect={reconnect}
      />

      {/* Toast 通知 */}
      <TournamentToast toast={toast} />

      <section className="flex flex-col items-center mt-[20px] mb-[30px] gap-4">
        <div className="flex flex-row items-center gap-4">
          <h1 className="text-2xl font-bold">{currentTournament.title}</h1>
          <ManagerCourtProtected pageId={currentTournament.customLink}>
            <Button
              onClick={() =>
                router.push(
                  `${getPageUrlByType(PageType.COURTS)}/${currentTournament.courtCustomLink}${getPageUrlByType(PageType.TOURNAMENTS)}/${currentTournament.customLink}/edit`
                )
              }
              text="編輯"
              buttonStyle={ButtonStyleType.Active}
            />
          </ManagerCourtProtected>
        </div>
      </section>

      <TournamentDisplay tournamentData={currentTournament} isEditMode={false} />

      <div className="w-full">
        <ResponsiveWarning windowWidth={windowWidth} />

        <Card>{<TournamentContentFormatter content={currentTournament.content} />}</Card>
      </div>
    </section>
  );
};

export default TournamentBoard;
