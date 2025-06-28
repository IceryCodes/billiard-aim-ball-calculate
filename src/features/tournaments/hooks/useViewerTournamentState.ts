import { useCallback, useEffect, useState } from 'react';

import { RealtimeMessage } from '@/domains/realtime';
import {
  DrawingData,
  RealtimeMessageType,
  ToastNotification,
  ToastType,
  TournamentAction,
  TournamentProps,
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

interface ViewerTournamentStateProps {
  tournamentData: TournamentProps;
}

interface ViewerTournamentStateReturn {
  currentTournament: TournamentProps;
  toast: ToastNotification | null;
  windowWidth: number;
  lastUpdateTime: string;
  isConnected: boolean;
  onlineCount: number;
  reconnect: () => void;
  drawingData: DrawingData;
}

export const useViewerTournamentState = ({ tournamentData }: ViewerTournamentStateProps): ViewerTournamentStateReturn => {
  const [currentTournament, setCurrentTournament] = useState<TournamentProps>(tournamentData);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('');
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const [drawingData, setDrawingData] = useState<DrawingData>(
    tournamentData.drawingData || { lines: [], lastUpdated: Date.now() }
  );

  const userId = useState(() => `${UserType.VIEWER}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)[0];

  const showToast = useCallback((message: string, type: ToastType, duration = 3000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  }, []);

  // 觀看者的訊息處理邏輯
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
          showToast('選手資訊已更新', ToastType.INFO, 2000);
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
              showToast('比賽結果已更新', ToastType.INFO, 2000);
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
          break;

        case RealtimeMessageType.DRAWING_UPDATE:
          if (isDrawingUpdate(message)) {
            // console.log('📨 [VIEWER] 收到繪圖更新:', message.data.drawingData);
            setDrawingData(message.data.drawingData);
            showToast('繪圖已更新', ToastType.INFO, 2000);
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
          break;
      }

      setLastUpdateTime(new Date().toLocaleTimeString());
    },
    [showToast]
  );

  const { isConnected, onlineCount, reconnect } = useTournamentRealtime({
    tournamentId: tournamentData.customLink,
    userId,
    enabled: !!tournamentData.customLink,
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      showToast('即時更新已連線', ToastType.SUCCESS, 2000);
    },
    onDisconnect: () => {
      showToast('即時更新已斷開', ToastType.WARNING, 2000);
    },
    onError: (error) => {
      console.error('WebSocket 錯誤:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      showToast(`連線錯誤: ${errorMessage}`, ToastType.WARNING);
    },
  });

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
    reconnect,
    drawingData,
  };
};
