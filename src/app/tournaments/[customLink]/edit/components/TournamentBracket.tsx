'use client';

import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';

import { PageType } from '@/domains/interface';
import { BroadcastUpdateData } from '@/domains/realtime';
import { Match, Player, PlayerCount, TournamentProps, TournamentType, UpdateTournamentDto } from '@/domains/tournament';
import { useTournamentRealtime } from '@/features/useTournamentRealtime';
import { Button, ButtonStyleType } from '@/global-components/buttons/Button';
import Card from '@/global-components/Card';
import Popup from '@/global-components/Popup';

import EditablePlayer from './EditablePlayer';
import SingleEliminationKonva from './SingleEliminationKonva';

const Tips = (): ReactElement => (
  <section className="min-w-80 flex flex-col gap-y-4">
    <p>在參賽選手區塊連點選手名稱可編輯</p>
    <p>在賽程表區塊點擊比賽框中的選手選擇獲勝者</p>
    <p className="text-blue-600">💡 所有編輯都會即時同步給觀看者</p>
  </section>
);

interface TournamentBracketProps {
  tournamentData: TournamentProps;
  updateTournament: (tournament: UpdateTournamentDto) => void;
  refetchTournament: () => void;
}

const TournamentBracket = ({
  tournamentData,
  updateTournament,
  refetchTournament,
}: TournamentBracketProps): ReactElement => {
  const [showTips, setShowTips] = useState<boolean>(false);
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);

  const [editorId] = useState(() => `editor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const { isConnected, onlineCount, broadcastUpdate } = useTournamentRealtime({
    tournamentId: tournamentData.customLink,
    userId: editorId,
    enabled: !!tournamentData.customLink,
    onMessage: (message) => {
      if (message.type === 'tournamentUpdated' && message.fromUserId && message.fromUserId !== editorId) {
        setToast({ message: '其他編輯者更新了賽事', type: 'info' });
        setTimeout(() => setToast(null), 3000);
      }
    },
    onConnect: () => {
      setToast({ message: '即時廣播已連接', type: 'success' });
      setTimeout(() => setToast(null), 2000);
    },
    onDisconnect: () => {
      setToast({ message: '即時廣播已斷開', type: 'warning' });
      setTimeout(() => setToast(null), 2000);
    },
  });

  const handlePlayerNameChange = useCallback(
    async (id: number, name: string) => {
      // console.log('🔄 更新選手:', id, name);

      const updatedPlayers = tournamentData.tournament.players.map((player) =>
        player.id === id ? { ...player, name } : player
      );

      const updatedMatches = tournamentData.tournament.matches.map((match) => ({
        ...match,
        player1: match.player1?.id === id ? { ...match.player1, name } : match.player1,
        player2: match.player2?.id === id ? { ...match.player2, name } : match.player2,
        winner: match.winner?.id === id ? { ...match.winner, name } : match.winner,
      }));

      const updatedTournamentData = {
        ...tournamentData,
        tournament: {
          ...tournamentData.tournament,
          players: updatedPlayers,
          matches: updatedMatches,
        },
        updatedAt: new Date(),
      };

      try {
        await updateTournament(updatedTournamentData);

        const broadcastData: BroadcastUpdateData = {
          type: 'playerUpdate',
          data: {
            playerId: id,
            playerName: name,
            players: updatedPlayers,
            matches: updatedMatches,
            action: 'player_name_changed',
          },
          action: 'player_name_changed',
        };

        // console.log('📡 廣播選手更新:', broadcastData);
        const success = await broadcastUpdate(broadcastData);
        refetchTournament();

        setToast({
          message: success ? '✅ 選手名稱已更新並同步' : '⚠️ 選手名稱已更新（同步可能延遲）',
          type: success ? 'success' : 'warning',
        });
        setTimeout(() => setToast(null), 3000);
      } catch (error) {
        console.error('❌ 更新選手失敗:', error);
        setToast({ message: '❌ 更新失敗', type: 'error' });
        setTimeout(() => setToast(null), 3000);
      }
    },
    [tournamentData, updateTournament, broadcastUpdate, refetchTournament]
  );

  const handlePlayerCountChange = useCallback(
    async (count: PlayerCount) => {
      const updatedTournamentData = {
        ...tournamentData,
        tournament: {
          ...tournamentData.tournament,
          playerCount: count,
        },
        updatedAt: new Date(),
      };

      try {
        await updateTournament(updatedTournamentData);

        const broadcastData: BroadcastUpdateData = {
          type: 'tournamentUpdated',
          data: {
            tournament: {
              ...tournamentData.tournament,
              playerCount: count,
            },
          },
          action: 'player_count_changed',
        };

        const success = await broadcastUpdate(broadcastData);
        refetchTournament();

        setToast({
          message: success ? `✅ 參賽人數已更改為 ${count} 人並同步` : `⚠️ 參賽人數已更改為 ${count} 人（同步可能延遲）`,
          type: success ? 'success' : 'warning',
        });
        setTimeout(() => setToast(null), 3000);
      } catch (error) {
        console.error('❌ 更新參賽人數失敗:', error);
        setToast({ message: '❌ 更新失敗', type: 'error' });
        setTimeout(() => setToast(null), 3000);
      }
    },
    [tournamentData, updateTournament, broadcastUpdate, refetchTournament]
  );

  const handleTournamentTypeChange = useCallback(
    async (type: TournamentType) => {
      const updatedTournamentData = {
        ...tournamentData,
        tournament: {
          ...tournamentData.tournament,
          tournamentType: type,
        },
        updatedAt: new Date(),
      };

      try {
        await updateTournament(updatedTournamentData);

        const broadcastData: BroadcastUpdateData = {
          type: 'tournamentUpdated',
          data: {
            tournament: {
              ...tournamentData.tournament,
              tournamentType: type,
            },
          },
          action: 'tournament_type_changed',
        };

        const success = await broadcastUpdate(broadcastData);
        const typeName = type === TournamentType.SINGLE ? '單敗淘汰' : '雙敗淘汰';
        refetchTournament();

        setToast({
          message: success ? `✅ 賽事類型已更改為${typeName}並同步` : `⚠️ 賽事類型已更改為${typeName}（同步可能延遲）`,
          type: success ? 'success' : 'warning',
        });
        setTimeout(() => setToast(null), 3000);
      } catch (error) {
        console.error('❌ 更新賽事類型失敗:', error);
        setToast({ message: '❌ 更新失敗', type: 'error' });
        setTimeout(() => setToast(null), 3000);
      }
    },
    [tournamentData, updateTournament, broadcastUpdate, refetchTournament]
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDragStart = useCallback((player: Player) => {
    // 拖拽邏輯
  }, []);

  const handleMatchUpdate = useCallback(
    async (matches: Match[]) => {
      const updatedTournamentData = {
        ...tournamentData,
        tournament: {
          ...tournamentData.tournament,
          matches,
        },
        updatedAt: new Date(),
      };

      try {
        await updateTournament(updatedTournamentData);

        const broadcastData: BroadcastUpdateData = {
          type: 'matchUpdate',
          data: {
            matches,
            action: 'match_result_updated',
          },
          action: 'match_result_updated',
        };

        const success = await broadcastUpdate(broadcastData);
        refetchTournament();

        setToast({
          message: success ? '✅ 比賽結果已更新並同步' : '⚠️ 比賽結果已更新（同步可能延遲）',
          type: success ? 'success' : 'warning',
        });
        setTimeout(() => setToast(null), 3000);
      } catch (error) {
        console.error('❌ 更新比賽結果失敗:', error);
        setToast({ message: '❌ 更新失敗', type: 'error' });
        setTimeout(() => setToast(null), 3000);
      }
    },
    [tournamentData, updateTournament, broadcastUpdate, refetchTournament]
  );

  const handleTestBroadcast = useCallback(
    async (testType: string) => {
      let broadcastData: BroadcastUpdateData;

      switch (testType) {
        case 'announcement':
          broadcastData = {
            type: 'announcement',
            message: '賽事管理員發送了一條測試公告',
          };
          break;
        case 'testUpdate':
          broadcastData = {
            type: 'testUpdate',
            message: '這是一個測試更新',
          };
          break;
        case 'refreshRequest':
          broadcastData = {
            type: 'refreshRequest',
          };
          break;
        default:
          console.error('未知的測試類型:', testType);
          return;
      }

      const success = await broadcastUpdate(broadcastData);
      refetchTournament();

      setToast({
        message: success ? `✅ ${testType} 測試廣播成功` : `❌ ${testType} 測試廣播失敗`,
        type: success ? 'success' : 'error',
      });
      setTimeout(() => setToast(null), 3000);
    },
    [broadcastUpdate, refetchTournament]
  );

  const renderTournament = useMemo((): ReactElement => {
    return (
      <div className="max-w-full mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-background">賽事類型</h3>
              <div className="flex space-x-4">
                <Button
                  onClick={() => handleTournamentTypeChange(TournamentType.SINGLE)}
                  text="單敗淘汰"
                  buttonStyle={
                    tournamentData.tournament.tournamentType === TournamentType.SINGLE
                      ? ButtonStyleType.Active
                      : ButtonStyleType.Disabled
                  }
                />
                <Button
                  onClick={() => handleTournamentTypeChange(TournamentType.DOUBLE)}
                  text="雙敗淘汰"
                  buttonStyle={
                    tournamentData.tournament.tournamentType === TournamentType.DOUBLE
                      ? ButtonStyleType.Active
                      : ButtonStyleType.Disabled
                  }
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-background">參賽人數</h3>
              <div className="flex flex-wrap gap-2">
                {Object.values(PlayerCount)
                  .filter((value) => typeof value === 'number')
                  .map((count) => (
                    <Button
                      key={count}
                      onClick={() => handlePlayerCountChange(count as PlayerCount)}
                      text={count.toString()}
                      buttonStyle={
                        tournamentData.tournament.playerCount === count ? ButtonStyleType.Active : ButtonStyleType.Disabled
                      }
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-background">
            參賽選手 ({tournamentData.tournament.players.length} 人)
          </h3>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, 120px)' }}>
            {tournamentData.tournament.players.map((player) => (
              <EditablePlayer
                key={player.id}
                player={player}
                onNameChange={handlePlayerNameChange}
                onDragStart={handleDragStart}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold p-6 pb-2 text-center text-background">
            {tournamentData.tournament.tournamentType === TournamentType.SINGLE ? '單敗淘汰' : '雙敗淘汰'}賽程表
          </h3>

          <div
            className="w-full overflow-x-auto overflow-y-hidden p-4"
            style={{
              scrollBehavior: 'smooth',
            }}
            ref={(el) => {
              if (el) {
                setTimeout(() => {
                  const maxScroll = el.scrollWidth - el.clientWidth;
                  if (maxScroll > 0) {
                    el.scrollLeft = Math.max(0, maxScroll * 0.8);
                  }
                }, 100);
              }
            }}
          >
            <div className="min-w-fit" style={{ width: 'max-content' }}>
              {tournamentData.tournament.tournamentType === TournamentType.SINGLE && (
                <SingleEliminationKonva
                  players={tournamentData.tournament.players}
                  matches={tournamentData.tournament.matches}
                  onMatchUpdate={handleMatchUpdate}
                />
              )}

              {tournamentData.tournament.tournamentType === TournamentType.DOUBLE && (
                <div className="text-center text-gray-500 py-8">雙敗淘汰賽程表功能開發中...</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4 text-background">即時廣播控制</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600 mb-1">連接狀態</div>
              <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">{isConnected ? '✅ 已連接' : '❌ 未連接'}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600 mb-1">觀看人數</div>
              <div className="text-blue-600 font-medium">👁️ {onlineCount} 人正在觀看</div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleTestBroadcast('announcement')}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              disabled={!isConnected}
            >
              📢 發送測試公告
            </button>

            <button
              onClick={() => handleTestBroadcast('testUpdate')}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={!isConnected}
            >
              🧪 發送測試更新
            </button>

            <button
              onClick={() => handleTestBroadcast('refreshRequest')}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              disabled={!isConnected}
            >
              🔄 要求觀看者重新載入
            </button>
          </div>

          {!isConnected && <p className="text-red-600 text-sm mt-2">⚠️ 即時廣播未連接，編輯不會即時同步</p>}
        </div>
      </div>
    );
  }, [
    handleDragStart,
    handleMatchUpdate,
    handlePlayerCountChange,
    handlePlayerNameChange,
    handleTournamentTypeChange,
    handleTestBroadcast,
    tournamentData.tournament.matches,
    tournamentData.tournament.playerCount,
    tournamentData.tournament.players,
    tournamentData.tournament.tournamentType,
    isConnected,
    onlineCount,
  ]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return (
    <section className="flex flex-col items-center">
      {/* 狀態欄 */}
      <div className="w-full bg-blue-50 border-b border-blue-200 px-4 py-3 mb-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-700 font-medium">
                編輯模式 - {isConnected ? '即時廣播已啟用' : '即時廣播已斷開'}
              </span>
            </div>

            {onlineCount > 0 && <div className="text-blue-700">👥 {onlineCount} 人正在觀看您的編輯</div>}
          </div>

          <div className="text-gray-600">賽事: {tournamentData.title}</div>
        </div>
      </div>

      {/* Toast 通知 */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white ${
            toast.type === 'success'
              ? 'bg-green-500'
              : toast.type === 'warning'
                ? 'bg-yellow-500'
                : toast.type === 'error'
                  ? 'bg-red-500'
                  : 'bg-blue-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      <section className="flex flex-col items-center mt-[20px] mb-[30px] gap-4">
        <div className="flex flex-row items-center gap-4">
          <h1 className="text-2xl font-bold">{tournamentData.title}</h1>
          <Button onClick={() => setShowTips(true)} text="說明" buttonStyle={ButtonStyleType.Active} />
        </div>
      </section>

      <div className="w-full">
        {windowWidth <= 400 && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">建議使用較大的螢幕或將手機旋轉至橫向模式以獲得最佳體驗</p>
              </div>
            </div>
          </div>
        )}
        <Card>{tournamentData.content}</Card>
        {renderTournament}
      </div>

      <Popup title={`${PageType.TOURNAMENTS}說明`} display={showTips} onClose={() => setShowTips(false)}>
        <Tips />
      </Popup>
    </section>
  );
};

export default TournamentBracket;
