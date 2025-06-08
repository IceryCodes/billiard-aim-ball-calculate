'use client';

import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { getPageUrlByType, PageType } from '@/domains/interface';
import {
  AnnouncementMessage,
  MatchUpdateMessage,
  PlayerUpdateCompleteMessage,
  PlayerUpdateSingleMessage,
  RealtimeMessage,
  TestUpdateMessage,
  ToastNotification,
  TournamentUpdatedMessage,
} from '@/domains/realtime';
import { TournamentProps, TournamentType } from '@/domains/tournament';
import { useTournamentRealtime } from '@/features/useTournamentRealtime';
import { Button, ButtonStyleType } from '@/global-components/buttons/Button';
import Card from '@/global-components/Card';
import ManagerCourtProtected from '@/hooks/utils/protections/components/ManagerCourtProtected';

import SingleEliminationKonva from '../edit/components/SingleEliminationKonva';

interface TournamentBoardProps {
  tournamentData: TournamentProps;
}

const TournamentBoard = ({ tournamentData }: TournamentBoardProps): ReactElement => {
  const router = useRouter();

  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [currentTournament, setCurrentTournament] = useState<TournamentProps>(tournamentData);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [toast, setToast] = useState<ToastNotification | null>(null);

  const [viewerId] = useState(() => `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // 類型守護函數
  const isPlayerUpdateComplete = (message: RealtimeMessage): message is PlayerUpdateCompleteMessage => {
    return message.type === 'playerUpdate' && 'players' in (message.data || {});
  };

  const isPlayerUpdateSingle = (message: RealtimeMessage): message is PlayerUpdateSingleMessage => {
    return message.type === 'playerUpdate' && 'playerId' in (message.data || {}) && 'playerName' in (message.data || {});
  };

  const isMatchUpdate = (message: RealtimeMessage): message is MatchUpdateMessage => {
    return message.type === 'matchUpdate' && 'matches' in (message.data || {});
  };

  const isTournamentUpdated = (message: RealtimeMessage): message is TournamentUpdatedMessage => {
    return message.type === 'tournamentUpdated';
  };

  const isAnnouncement = (message: RealtimeMessage): message is AnnouncementMessage => {
    return message.type === 'announcement' && 'message' in message;
  };

  const isTestUpdate = (message: RealtimeMessage): message is TestUpdateMessage => {
    return message.type === 'testUpdate' && 'message' in message;
  };

  const handleWebSocketMessage = useCallback((message: RealtimeMessage) => {
    // console.log('📨 觀看頁面收到:', message.type, message);

    switch (message.type) {
      case 'playerUpdate':
        // console.log('🔄 處理選手更新');

        if (isPlayerUpdateComplete(message)) {
          // 完整的選手資料更新
          setCurrentTournament((prev) => {
            const newTournament = {
              ...prev,
              tournament: {
                ...prev.tournament,
                players: message.data.players,
                matches: message.data.matches || prev.tournament.matches,
              },
            };
            // console.log('✅ 賽事數據已更新 (完整):', newTournament);
            return newTournament;
          });
        } else if (isPlayerUpdateSingle(message)) {
          // 單個選手的更新
          const { playerId, playerName } = message.data;
          setCurrentTournament((prev) => {
            const newTournament = {
              ...prev,
              tournament: {
                ...prev.tournament,
                players: prev.tournament.players.map((player) =>
                  player.id === playerId ? { ...player, name: playerName } : player
                ),
                matches: prev.tournament.matches.map((match) => ({
                  ...match,
                  player1: match.player1?.id === playerId ? { ...match.player1, name: playerName } : match.player1,
                  player2: match.player2?.id === playerId ? { ...match.player2, name: playerName } : match.player2,
                  winner: match.winner?.id === playerId ? { ...match.winner, name: playerName } : match.winner,
                })),
              },
            };
            // console.log('✅ 賽事數據已更新 (單個選手):', newTournament);
            return newTournament;
          });
        }

        setToast({ message: '選手資訊已更新', type: 'info' });
        setTimeout(() => setToast(null), 2000);
        break;

      case 'matchUpdate':
        // console.log('🔄 處理比賽更新');

        if (isMatchUpdate(message)) {
          setCurrentTournament((prev) => {
            const newTournament = {
              ...prev,
              tournament: {
                ...prev.tournament,
                matches: message.data.matches,
              },
            };
            // console.log('✅ 比賽數據已更新:', newTournament);
            return newTournament;
          });

          setToast({ message: '比賽結果已更新', type: 'info' });
          setTimeout(() => setToast(null), 2000);
        }
        break;

      case 'tournamentUpdated':
        // console.log('🔄 處理賽事更新');

        if (isTournamentUpdated(message) && message.data) {
          setCurrentTournament((prev) => {
            const newTournament = {
              ...prev,
              ...message.data,
              tournament: {
                ...prev.tournament,
                ...message.data.tournament,
                players: message.data.tournament?.players || prev.tournament.players,
                matches: message.data.tournament?.matches || prev.tournament.matches,
              },
            };
            // console.log('✅ 賽事總體數據已更新:', newTournament);
            return newTournament;
          });

          if (message.data.action === 'player_count_changed') {
            setToast({ message: '參賽人數已變更', type: 'info' });
          } else if (message.data.action === 'tournament_type_changed') {
            setToast({ message: '賽事類型已變更', type: 'info' });
          } else {
            setToast({ message: '賽事資訊已更新', type: 'info' });
          }
          setTimeout(() => setToast(null), 2000);
        }
        break;

      case 'announcement':
        if (isAnnouncement(message)) {
          setToast({ message: message.message, type: 'announcement' });
          setTimeout(() => setToast(null), 5000);
        }
        break;

      case 'testUpdate':
        if (isTestUpdate(message)) {
          setToast({ message: message.message, type: 'info' });
          setTimeout(() => setToast(null), 3000);
        }
        break;

      case 'refreshRequest':
        setToast({ message: '管理員要求重新載入頁面', type: 'warning' });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        break;

      default:
      // console.log('❓ 未處理的訊息類型:', message.type);
    }

    setLastUpdateTime(new Date().toLocaleTimeString());
  }, []);

  const { isConnected, onlineCount, lastMessage, reconnect } = useTournamentRealtime({
    tournamentId: tournamentData.customLink,
    userId: viewerId,
    enabled: !!tournamentData.customLink,
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      setToast({ message: '即時更新已連接', type: 'success' });
      setTimeout(() => setToast(null), 2000);
    },
    onDisconnect: () => {
      setToast({ message: '即時更新已斷開', type: 'warning' });
      setTimeout(() => setToast(null), 2000);
    },
    onError: (error) => {
      console.error('WebSocket 錯誤:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setToast({ message: `連接錯誤: ${errorMessage}`, type: 'warning' });
      setTimeout(() => setToast(null), 3000);
    },
  });

  const renderTournament = useMemo((): ReactElement => {
    return (
      <div className="max-w-full mx-auto">
        <div className="bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold p-6 pb-2 text-center text-background">
            {currentTournament.tournament.tournamentType === TournamentType.SINGLE ? '單敗淘汰' : '雙敗淘汰'}賽程表
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
              {currentTournament.tournament.tournamentType === TournamentType.SINGLE && (
                <SingleEliminationKonva
                  players={currentTournament.tournament.players}
                  matches={currentTournament.tournament.matches}
                />
              )}

              {currentTournament.tournament.tournamentType === TournamentType.DOUBLE && (
                <div className="text-center text-gray-500 py-8">雙敗淘汰賽程表功能開發中...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }, [
    currentTournament.tournament.matches,
    currentTournament.tournament.players,
    currentTournament.tournament.tournamentType,
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
      <div className="w-full bg-gray-50 border-b border-gray-200 px-4 py-2 mb-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-600">{isConnected ? '🔄 即時更新已連接' : '❌ 即時更新已斷開'}</span>
              {!isConnected && (
                <button onClick={reconnect} className="text-blue-600 hover:text-blue-800 underline text-xs">
                  重新連接
                </button>
              )}
            </div>

            {onlineCount > 0 && (
              <div className="flex items-center space-x-1">
                <span className="text-gray-400">👁️</span>
                <span className="text-gray-600">{onlineCount} 人在線</span>
              </div>
            )}

            {lastUpdateTime && <div className="text-gray-400">最後更新: {lastUpdateTime}</div>}
          </div>
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
                : toast.type === 'announcement'
                  ? 'bg-purple-500'
                  : 'bg-blue-500'
          }`}
        >
          {toast.message}
        </div>
      )}

      <section className="flex flex-col items-center mt-[20px] mb-[30px] gap-4">
        <div className="flex flex-row items-center gap-4">
          <h1 className="text-2xl font-bold">{currentTournament.title}</h1>
          <ManagerCourtProtected pageId={currentTournament.customLink}>
            <Button
              onClick={() => router.push(`${getPageUrlByType(PageType.TOURNAMENTS)}/${currentTournament.customLink}/edit`)}
              text="編輯"
              buttonStyle={ButtonStyleType.Active}
            />
          </ManagerCourtProtected>
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

        <Card>{currentTournament.content}</Card>
        {renderTournament}
      </div>
    </section>
  );
};

export default TournamentBoard;
