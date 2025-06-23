import { ConnectionQualityType } from '@/app/courts/[courtCustomLink]/tournaments/[customLink]/edit/components/interfaces';
import {
  AnnouncementMessage,
  DrawingUpdateMessage,
  MatchUpdateMessage,
  PlayerUpdateCompleteMessage,
  PlayerUpdateSingleMessage,
  RealtimeMessage,
  TestUpdateMessage,
  TournamentUpdatedMessage,
} from '@/domains/realtime';
import { Match, Player, RealtimeMessageType, TournamentState, TournamentType } from '@/domains/tournament';

interface ComposeStatusDisplayProps {
  isConnected: boolean;
  connectionQuality: ConnectionQualityType;
  isEditMode: boolean;
}

export const isPlayerUpdateComplete = (message: RealtimeMessage): message is PlayerUpdateCompleteMessage => {
  return message.type === RealtimeMessageType.PLAYER_UPDATE && 'players' in (message.data || {});
};

export const isPlayerUpdateSingle = (message: RealtimeMessage): message is PlayerUpdateSingleMessage => {
  return (
    message.type === RealtimeMessageType.PLAYER_UPDATE &&
    'playerId' in (message.data || {}) &&
    'playerName' in (message.data || {})
  );
};

export const isMatchUpdate = (message: RealtimeMessage): message is MatchUpdateMessage => {
  return message.type === RealtimeMessageType.MATCH_UPDATE && 'matches' in (message.data || {});
};

export const isTournamentUpdated = (message: RealtimeMessage): message is TournamentUpdatedMessage => {
  return message.type === RealtimeMessageType.TOURNAMENT_UPDATED;
};

export const isAnnouncement = (message: RealtimeMessage): message is AnnouncementMessage => {
  return message.type === RealtimeMessageType.ANNOUNCEMENT && 'message' in message;
};

export const isTestUpdate = (message: RealtimeMessage): message is TestUpdateMessage => {
  return message.type === RealtimeMessageType.TEST_UPDATE && 'message' in message;
};

export const isDrawingUpdate = (message: RealtimeMessage): message is DrawingUpdateMessage => {
  return message.type === RealtimeMessageType.DRAWING_UPDATE && 'drawingData' in (message.data || {});
};

export const composeStatusDisplay = ({ isConnected, connectionQuality, isEditMode }: ComposeStatusDisplayProps) => {
  if (!isConnected) {
    return {
      icon: '❌',
      text: isEditMode ? '即時廣播已斷開' : '即時更新已斷開',
      color: 'text-red-600',
      dotColor: 'bg-red-500',
    };
  }

  if (connectionQuality === 'poor') {
    return {
      icon: '⚠️',
      text: isEditMode ? '即時廣播連線不穩' : '即時更新連線不穩',
      color: 'text-yellow-600',
      dotColor: 'bg-yellow-500',
    };
  }

  return {
    icon: '🔄',
    text: isEditMode ? '即時廣播已啟用' : '即時更新已啟用',
    color: isEditMode ? 'text-blue-700' : 'text-green-600',
    dotColor: 'bg-green-500',
  };
};

export const generateRandomCode = (length = 4): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
};

export const generateTournament = ({
  playerCount,
  tournamentType,
}: {
  playerCount: number;
  tournamentType: TournamentType;
}): TournamentState => {
  // 檢查是否為2的冪次方
  if (!Number.isInteger(Math.log2(playerCount))) {
    throw new Error('玩家數量必須是2的冪次方 (2, 4, 8, 16, 32, 64...)');
  }

  // 產生玩家
  const players: Player[] = Array.from({ length: playerCount }, (_, index) => ({
    id: index + 1,
    name: '',
  }));

  const matches: Match[] = [];
  let currentRoundPlayers = playerCount;
  let round = 1;

  while (currentRoundPlayers > 1) {
    const matchesInRound = currentRoundPlayers / 2;

    for (let i = 0; i < matchesInRound; i++) {
      const match: Match = {
        id: `round${round}-match${i}`,
        player1: null,
        player2: null,
        winner: null,
        round,
        matchIndex: i,
      };

      // 第一輪直接分配玩家
      if (round === 1) {
        match.player1 = players[i * 2];
        match.player2 = players[i * 2 + 1];
      }

      matches.push(match);
    }

    currentRoundPlayers = matchesInRound;
    round++;
  }

  return {
    playerCount,
    players,
    matches,
    tournamentType,
  };
};
