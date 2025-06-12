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
  isMatchUpdate,
  isPlayerUpdateComplete,
  isPlayerUpdateSingle,
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
        case RealtimeMessageType.PLAYER_UPDATE:
          if (isPlayerUpdateComplete(message)) {
            setCurrentTournament((prev) => ({
              ...prev,
              tournament: {
                ...prev.tournament,
                players: message.data.players || prev.tournament.players,
                matches: message.data.matches || prev.tournament.matches,
              },
            }));
          } else if (isPlayerUpdateSingle(message)) {
            const { playerId, playerName } = message.data;
            if (playerId && playerName) {
              setCurrentTournament((prev) => ({
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
                players: message.data.tournament?.players || prev.tournament.players,
                matches: message.data.tournament?.matches || prev.tournament.matches,
              },
            }));

            const actionMessages: Record<TournamentAction, string> = {
              [TournamentAction.PLAYER_COUNT_CHANGED]: '參賽人數已變更',
              [TournamentAction.TOURNAMENT_TYPE_CHANGED]: '賽程類型已變更',
              [TournamentAction.PLAYER_NAME_CHANGED]: '選手名稱已變更',
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
