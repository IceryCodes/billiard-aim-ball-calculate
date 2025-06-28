import { useCallback, useEffect, useState } from 'react';

import {
  UseTournamentStateProps,
  UseTournamentStateReturn,
} from '@/app/courts/[courtCustomLink]/tournaments/[customLink]/edit/components/interfaces';
import { BroadcastUpdateData, RealtimeMessage } from '@/domains/realtime';
import {
  BroadcastTestType,
  DrawingData,
  GamerCount,
  Match,
  RealtimeMessageType,
  ToastNotification,
  ToastType,
  TournamentAction,
  TournamentProps,
  TournamentType,
  UserType,
} from '@/domains/tournament';
import { useTournamentRealtime } from '@/features/tournaments/hooks/useTournamentRealtime';

import {
  isAnnouncement,
  isDrawingUpdate,
  isGamerUpdateComplete,
  isGamerUpdateSingle,
  isMatchUpdate,
  isTestUpdate,
  isTournamentUpdated,
} from '../helper';

export const useTournamentState = ({
  tournamentData,
  updateTournament,
  refetchTournament,
  isEditMode = false,
}: UseTournamentStateProps): UseTournamentStateReturn => {
  const [currentTournament, setCurrentTournament] = useState<TournamentProps>(tournamentData);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>(new Date().toLocaleTimeString());
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [drawingData, setDrawingData] = useState<DrawingData>(
    tournamentData.drawingData || { lines: [], lastUpdated: Date.now() }
  );

  const userId = useState(
    () => `${isEditMode ? UserType.EDITOR : UserType.VIEWER}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  )[0];

  const showToast = useCallback((message: string, type: ToastType, duration = 3000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  }, []);

  // 訊息處理邏輯
  const handleWebSocketMessage = useCallback(
    (message: RealtimeMessage) => {
      switch (message.type) {
        case RealtimeMessageType.GAMER_UPDATE:
          if (isGamerUpdateComplete(message)) {
            setCurrentTournament((prev) => ({
              ...prev,
              tournament: {
                ...prev.tournament,
                gamers: message.data.gamers || prev.tournament.gamers,
                matches: message.data.matches || prev.tournament.matches,
              },
            }));
          } else if (isGamerUpdateSingle(message)) {
            const { gamerId, gamerName } = message.data;
            if (gamerId && gamerName) {
              setCurrentTournament((prev) => ({
                ...prev,
                tournament: {
                  ...prev.tournament,
                  gamers: prev.tournament.gamers.map((gamer) =>
                    gamer.id === gamerId ? { ...gamer, name: gamerName } : gamer
                  ),
                  matches: prev.tournament.matches.map((match) => ({
                    ...match,
                    gamer1: match.gamer1?.id === gamerId ? { ...match.gamer1, name: gamerName } : match.gamer1,
                    gamer2: match.gamer2?.id === gamerId ? { ...match.gamer2, name: gamerName } : match.gamer2,
                    winner: match.winner?.id === gamerId ? { ...match.winner, name: gamerName } : match.winner,
                  })),
                },
              }));
            }
          }
          if (!isEditMode) {
            showToast('選手資訊已更新', ToastType.INFO, 2000);
          }
          break;

        case RealtimeMessageType.MATCH_UPDATE:
          if (isMatchUpdate(message)) {
            const { matches } = message.data;
            if (matches) {
              setCurrentTournament((prev) => ({
                ...prev,
                tournament: {
                  ...prev.tournament,
                  matches,
                },
              }));
              if (!isEditMode) {
                showToast('比賽結果已更新', ToastType.INFO, 2000);
              }
            }
          }
          break;

        case RealtimeMessageType.TOURNAMENT_UPDATED:
          if (isTournamentUpdated(message) && message.data) {
            setCurrentTournament((prev) => ({
              ...prev,
              ...message.data,
              tournament: {
                ...prev.tournament,
                ...message.data.tournament,
                gamers: message.data.tournament?.gamers || prev.tournament.gamers,
                matches: message.data.tournament?.matches || prev.tournament.matches,
              },
            }));

            if (!isEditMode) {
              const actionMessages: Record<TournamentAction, string> = {
                [TournamentAction.GAMER_COUNT_CHANGED]: '參賽人數已變更',
                [TournamentAction.TOURNAMENT_TYPE_CHANGED]: '賽程類型已變更',
                [TournamentAction.GAMER_NAME_CHANGED]: '選手名稱已變更',
                [TournamentAction.MATCH_RESULT_UPDATED]: '比賽結果已更新',
                [TournamentAction.DRAWING_UPDATED]: '繪圖已更新',
              };
              const defaultMessage = '賽程資訊已更新';
              const toastMessage = message.data.action
                ? actionMessages[message.data.action] || defaultMessage
                : defaultMessage;
              showToast(toastMessage, ToastType.INFO, 2000);
            }
          }
          break;

        case RealtimeMessageType.DRAWING_UPDATE:
          if (isDrawingUpdate(message)) {
            // console.log('📨 [DRAWING] 收到繪圖更新:', message.data.drawingData);
            setDrawingData(message.data.drawingData);
            if (!isEditMode) {
              showToast('繪圖已更新', ToastType.INFO, 2000);
            }
          }
          break;

        case RealtimeMessageType.ANNOUNCEMENT:
          if (isAnnouncement(message)) {
            showToast(message.message, ToastType.ANNOUNCEMENT, 5000);
          }
          break;

        case RealtimeMessageType.TEST_UPDATE:
          if (isTestUpdate(message)) {
            showToast(message.message, ToastType.INFO);
          }
          break;

        case RealtimeMessageType.REFRESH_REQUEST:
          showToast('管理員要求重新載入頁面', ToastType.WARNING, 2000);
          setTimeout(() => window.location.reload(), 2000);
          break;

        default:
          if (isEditMode) {
            showToast('其他編輯者更新了賽程', ToastType.INFO);
          }
          break;
      }

      setLastUpdateTime(new Date().toLocaleTimeString());
    },
    [isEditMode, showToast]
  );

  // ✅ 從 useTournamentRealtime 中獲取 connectionQuality
  const { isConnected, onlineCount, connectionQuality, broadcastUpdate, reconnect } = useTournamentRealtime({
    tournamentId: tournamentData.customLink,
    userId,
    enabled: !!tournamentData.customLink,
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      showToast(isEditMode ? '即時廣播已連線' : '即時更新已連線', ToastType.SUCCESS, 2000);
    },
    onDisconnect: () => {
      showToast(isEditMode ? '即時廣播已斷開' : '即時更新已斷開', ToastType.WARNING, 2000);
    },
    onError: (error) => {
      console.error('WebSocket 錯誤:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      showToast(`連線錯誤: ${errorMessage}`, ToastType.WARNING);
    },
  });

  // 繪圖更新處理
  const handleDrawingUpdate = useCallback(
    async (newDrawingData: DrawingData): Promise<void> => {
      if (!updateTournament || !refetchTournament) return;

      // console.log('🎨 [DRAWING] 處理繪圖更新:', newDrawingData);

      // 立即更新本地狀態
      setDrawingData(newDrawingData);

      const updatedTournamentData = {
        ...currentTournament,
        drawingData: newDrawingData,
        updatedAt: new Date(),
      };

      try {
        await updateTournament(updatedTournamentData);

        const broadcastData: BroadcastUpdateData = {
          type: RealtimeMessageType.DRAWING_UPDATE,
          data: {
            drawingData: newDrawingData,
            action: TournamentAction.DRAWING_UPDATED,
          },
          action: TournamentAction.DRAWING_UPDATED,
        };

        const success = await broadcastUpdate(broadcastData);

        // 確保數據庫和本地狀態同步
        setTimeout(() => {
          refetchTournament();
        }, 100);

        showToast(
          success ? '✅ 繪圖已更新並同步' : '⚠️ 繪圖已更新（同步可能延遲）',
          success ? ToastType.SUCCESS : ToastType.WARNING
        );
      } catch (error) {
        console.error('❌ 更新繪圖失敗:', error);
        showToast('❌ 繪圖更新失敗', ToastType.ERROR);
        // 如果更新失敗，回滾本地狀態
        setTimeout(() => {
          refetchTournament();
        }, 100);
      }
    },
    [currentTournament, updateTournament, broadcastUpdate, refetchTournament, showToast]
  );

  // 編輯相關的操作方法
  const handleGamerNameChange = useCallback(
    async (id: number, name: string): Promise<void> => {
      if (!updateTournament || !refetchTournament) return;

      const updatedGamers = currentTournament.tournament.gamers.map((gamer) =>
        gamer.id === id ? { ...gamer, name } : gamer
      );

      const updatedMatches = currentTournament.tournament.matches.map((match) => ({
        ...match,
        gamer1: match.gamer1?.id === id ? { ...match.gamer1, name } : match.gamer1,
        gamer2: match.gamer2?.id === id ? { ...match.gamer2, name } : match.gamer2,
        winner: match.winner?.id === id ? { ...match.winner, name } : match.winner,
      }));

      // 立即更新本地狀態
      setCurrentTournament((prev) => ({
        ...prev,
        tournament: {
          ...prev.tournament,
          gamers: updatedGamers,
          matches: updatedMatches,
        },
      }));

      const updatedTournamentData = {
        ...currentTournament,
        tournament: {
          ...currentTournament.tournament,
          gamers: updatedGamers,
          matches: updatedMatches,
        },
        updatedAt: new Date(),
      };

      try {
        await updateTournament(updatedTournamentData);

        const broadcastData: BroadcastUpdateData = {
          type: RealtimeMessageType.GAMER_UPDATE,
          data: {
            gamerId: id,
            gamerName: name,
            gamers: updatedGamers,
            matches: updatedMatches,
            action: TournamentAction.GAMER_NAME_CHANGED,
          },
          action: TournamentAction.GAMER_NAME_CHANGED,
        };

        const success = await broadcastUpdate(broadcastData);

        // 確保數據庫和本地狀態同步
        setTimeout(() => {
          refetchTournament();
        }, 100);

        showToast(
          success ? '✅ 選手名稱已更新並同步' : '⚠️ 選手名稱已更新（同步可能延遲）',
          success ? ToastType.SUCCESS : ToastType.WARNING
        );
      } catch (error) {
        console.error('❌ 更新選手失敗:', error);
        showToast('❌ 更新失敗', ToastType.ERROR);
        // 如果更新失敗，回滾本地狀態
        setTimeout(() => {
          refetchTournament();
        }, 100);
      }
    },
    [currentTournament, updateTournament, broadcastUpdate, refetchTournament, showToast]
  );

  const handleGamerGamesChange = useCallback(
    async (id: number, games: number): Promise<void> => {
      if (!updateTournament || !refetchTournament) return;

      // 完全複製 handleGamerNameChange 的邏輯，只是改成更新 games 欄位
      const updatedGamers = currentTournament.tournament.gamers.map((gamer) =>
        gamer.id === id ? { ...gamer, games } : gamer
      );

      const updatedMatches = currentTournament.tournament.matches.map((match) => ({
        ...match,
        gamer1: match.gamer1?.id === id ? { ...match.gamer1, games } : match.gamer1,
        gamer2: match.gamer2?.id === id ? { ...match.gamer2, games } : match.gamer2,
        winner: match.winner?.id === id ? { ...match.winner, games } : match.winner,
      }));

      // 立即更新本地狀態
      setCurrentTournament((prev) => ({
        ...prev,
        tournament: {
          ...prev.tournament,
          gamers: updatedGamers,
          matches: updatedMatches,
        },
      }));

      const updatedTournamentData = {
        ...currentTournament,
        tournament: {
          ...currentTournament.tournament,
          gamers: updatedGamers,
          matches: updatedMatches,
        },
        updatedAt: new Date(),
      };

      try {
        await updateTournament(updatedTournamentData);

        const broadcastData: BroadcastUpdateData = {
          type: RealtimeMessageType.GAMER_UPDATE,
          data: {
            gamerId: id,
            gamers: updatedGamers,
            matches: updatedMatches,
            action: TournamentAction.GAMER_NAME_CHANGED, // 重用相同的 action
          },
          action: TournamentAction.GAMER_NAME_CHANGED,
        };

        const success = await broadcastUpdate(broadcastData);

        // 確保數據庫和本地狀態同步
        setTimeout(() => {
          refetchTournament();
        }, 100);

        showToast(
          success ? '✅ 選手遊戲局數已更新並同步' : '⚠️ 選手遊戲局數已更新（同步可能延遲）',
          success ? ToastType.SUCCESS : ToastType.WARNING
        );
      } catch (error) {
        console.error('❌ 更新選手遊戲局數失敗:', error);
        showToast('❌ 更新失敗', ToastType.ERROR);
        // 如果更新失敗，回滾本地狀態
        setTimeout(() => {
          refetchTournament();
        }, 100);
      }
    },
    [currentTournament, updateTournament, broadcastUpdate, refetchTournament, showToast]
  );

  const handleGamerCountChange = useCallback(
    async (count: GamerCount): Promise<void> => {
      if (!updateTournament || !refetchTournament) return;

      const updatedTournamentData = {
        ...currentTournament,
        tournament: {
          ...currentTournament.tournament,
          gamerCount: count,
        },
        updatedAt: new Date(),
      };

      try {
        await updateTournament(updatedTournamentData);

        const broadcastData: BroadcastUpdateData = {
          type: RealtimeMessageType.TOURNAMENT_UPDATED,
          data: {
            tournament: {
              ...currentTournament.tournament,
              gamerCount: count,
            },
          },
          action: TournamentAction.GAMER_COUNT_CHANGED,
        };

        const success = await broadcastUpdate(broadcastData);
        refetchTournament();

        showToast(
          success ? `✅ 參賽人數已更改為 ${count} 人並同步` : `⚠️ 參賽人數已更改為 ${count} 人（同步可能延遲）`,
          success ? ToastType.SUCCESS : ToastType.WARNING
        );
      } catch (error) {
        console.error('❌ 更新參賽人數失敗:', error);
        showToast('❌ 更新失敗', ToastType.ERROR);
      }
    },
    [currentTournament, updateTournament, broadcastUpdate, refetchTournament, showToast]
  );

  const handleTournamentTypeChange = useCallback(
    async (type: TournamentType): Promise<void> => {
      if (!updateTournament || !refetchTournament) return;

      const updatedTournamentData = {
        ...currentTournament,
        tournament: {
          ...currentTournament.tournament,
          tournamentType: type,
        },
        updatedAt: new Date(),
      };

      try {
        await updateTournament(updatedTournamentData);

        const broadcastData: BroadcastUpdateData = {
          type: RealtimeMessageType.TOURNAMENT_UPDATED,
          data: {
            tournament: {
              ...currentTournament.tournament,
              tournamentType: type,
            },
          },
          action: TournamentAction.TOURNAMENT_TYPE_CHANGED,
        };

        const success = await broadcastUpdate(broadcastData);
        const typeName = type === TournamentType.SINGLE ? '單敗淘汰' : '雙敗淘汰';
        refetchTournament();

        showToast(
          success ? `✅ 賽程類型已更改為${typeName}並同步` : `⚠️ 賽程類型已更改為${typeName}（同步可能延遲）`,
          success ? ToastType.SUCCESS : ToastType.WARNING
        );
      } catch (error) {
        console.error('❌ 更新賽程類型失敗:', error);
        showToast('❌ 更新失敗', ToastType.ERROR);
      }
    },
    [currentTournament, updateTournament, broadcastUpdate, refetchTournament, showToast]
  );

  const handleMatchUpdate = useCallback(
    async (matches: Match[]): Promise<void> => {
      if (!updateTournament || !refetchTournament) return;

      // 立即更新本地狀態
      setCurrentTournament((prev) => ({
        ...prev,
        tournament: {
          ...prev.tournament,
          matches,
        },
      }));

      const updatedTournamentData = {
        ...currentTournament,
        tournament: {
          ...currentTournament.tournament,
          matches,
        },
        updatedAt: new Date(),
      };

      try {
        await updateTournament(updatedTournamentData);

        const broadcastData: BroadcastUpdateData = {
          type: RealtimeMessageType.MATCH_UPDATE,
          data: {
            matches,
            action: TournamentAction.MATCH_RESULT_UPDATED,
          },
          action: TournamentAction.MATCH_RESULT_UPDATED,
        };

        const success = await broadcastUpdate(broadcastData);

        // 確保數據庫和本地狀態同步
        setTimeout(() => {
          refetchTournament();
        }, 100);

        showToast(
          success ? '✅ 比賽結果已更新並同步' : '⚠️ 比賽結果已更新（同步可能延遲）',
          success ? ToastType.SUCCESS : ToastType.WARNING
        );
      } catch (error) {
        console.error('❌ 更新比賽結果失敗:', error);
        showToast('❌ 更新失敗', ToastType.ERROR);
        // 如果更新失敗，回滾本地狀態
        setTimeout(() => {
          refetchTournament();
        }, 100);
      }
    },
    [currentTournament, updateTournament, broadcastUpdate, refetchTournament, showToast]
  );

  const handleTestBroadcast = useCallback(
    async (testType: BroadcastTestType): Promise<void> => {
      let broadcastData: BroadcastUpdateData;

      switch (testType) {
        case BroadcastTestType.ANNOUNCEMENT:
          broadcastData = {
            type: RealtimeMessageType.ANNOUNCEMENT,
            message: '賽程管理員發送了一條測試公告',
          };
          break;
        case BroadcastTestType.TEST_UPDATE:
          broadcastData = {
            type: RealtimeMessageType.TEST_UPDATE,
            message: '這是一個測試更新',
          };
          break;
        case BroadcastTestType.REFRESH_REQUEST:
          broadcastData = {
            type: RealtimeMessageType.REFRESH_REQUEST,
          };
          break;
        default:
          console.error('未知的測試類型:', testType);
          return;
      }

      const success = await broadcastUpdate(broadcastData);
      if (refetchTournament) refetchTournament();

      showToast(
        success ? `✅ ${testType} 測試廣播成功` : `❌ ${testType} 測試廣播失敗`,
        success ? ToastType.SUCCESS : ToastType.ERROR
      );
    },
    [broadcastUpdate, refetchTournament, showToast]
  );

  // 當外部 tournamentData 更新時，同步本地狀態
  useEffect(() => {
    setCurrentTournament(tournamentData);
    if (tournamentData.drawingData) {
      setDrawingData(tournamentData.drawingData);
    }
  }, [tournamentData]);

  // Window resize effect
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

  return {
    currentTournament,
    toast,
    windowWidth,
    lastUpdateTime,
    isConnected,
    onlineCount,
    connectionQuality,
    reconnect,
    handleGamerNameChange,
    handleGamerGamesChange,
    handleGamerCountChange,
    handleTournamentTypeChange,
    handleMatchUpdate,
    handleTestBroadcast,
    drawingData,
    handleDrawingUpdate,
  };
};
