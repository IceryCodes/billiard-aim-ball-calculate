'use client';

import { ReactElement, useCallback, useState } from 'react';

import Link from 'next/link';

import { useAuth } from '@/contexts/AuthContext';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { Player, TournamentProps, UpdateTournamentDto } from '@/domains/tournament';
import { useTournamentState } from '@/features/tournaments/hooks/useTournamentState';
import { Button, ButtonStyleType } from '@/global-components/buttons/Button';
import Card from '@/global-components/Card';
import Popup from '@/global-components/Popup';
import { TournamentUpdateReturnType } from '@/services/interfaces';

import {
  ResponsiveWarning,
  TournamentContentFormatter,
  TournamentControls,
  TournamentDisplay,
  TournamentStatusBar,
  TournamentToast,
} from '../../components/shared/TournamentShared';

const Tips = (): ReactElement => (
  <section className="min-w-80 flex flex-col gap-y-4">
    <p>在參賽選手區塊連點選手名稱可編輯</p>
    <p>在賽程表區塊點擊比賽框中的選手選擇獲勝者</p>
    <p>點擊「✏️ 繪圖」按鈕開始繪畫，再次點擊結束繪畫模式</p>
    <p>使用「🗑️ 清除」按鈕可以清除所有繪圖內容</p>
    <p className="text-blue-600">💡 所有編輯和繪圖都會即時同步給觀看者</p>
  </section>
);

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
  const [showTips, setShowTips] = useState<boolean>(false);
  const { isLoading: authLoading } = useAuth();

  const {
    currentTournament,
    toast,
    windowWidth,
    isConnected,
    onlineCount,
    handlePlayerNameChange,
    handlePlayerCountChange,
    handleTournamentTypeChange,
    handleMatchUpdate,
    handleTestBroadcast,
    drawingData,
    handleDrawingUpdate,
  } = useTournamentState({
    tournamentData,
    updateTournament,
    refetchTournament,
    isEditMode: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDragStart = useCallback((player: Player) => {
    // 拖拽邏輯
  }, []);

  if (authLoading) return <span>載入中...</span>;

  return (
    <section className="flex flex-col items-center gap-y-4">
      {/* 狀態欄 */}
      <TournamentStatusBar
        isConnected={isConnected}
        onlineCount={onlineCount}
        isEditMode={true}
        tournamentTitle={tournamentData.title}
      />

      {/* Toast 通知 */}
      <TournamentToast toast={toast} />

      <section className="flex flex-col items-center mt-[20px] mb-[30px] gap-4">
        <div className="flex flex-row items-center gap-4">
          <Link
            title={tournamentData.title}
            href={`${getPageUrlByType(PageType.COURTS)}/${tournamentData.courtCustomLink}${getPageUrlByType(PageType.TOURNAMENTS)}/${tournamentData.customLink}`}
          >
            <h1 className="text-2xl font-bold">{tournamentData.title}</h1>
          </Link>
          <Button onClick={() => setShowTips(true)} text="說明" buttonStyle={ButtonStyleType.Active} />
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
        />

        {/* 編輯控制面板 */}
        <TournamentControls
          tournament={currentTournament.tournament}
          isConnected={isConnected}
          onlineCount={onlineCount}
          onPlayerCountChange={handlePlayerCountChange}
          onTournamentTypeChange={handleTournamentTypeChange}
          onPlayerNameChange={handlePlayerNameChange}
          onDragStart={handleDragStart}
          onTestBroadcast={handleTestBroadcast}
        />
      </div>

      <Card>{<TournamentContentFormatter content={tournamentData.content} />}</Card>

      <Popup title={`${PageType.TOURNAMENTS}說明`} display={showTips} onClose={() => setShowTips(false)}>
        <Tips />
      </Popup>
    </section>
  );
};

export default TournamentBracket;
