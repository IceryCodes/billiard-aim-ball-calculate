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
import { RealtimeMessageType } from '@/domains/tournament';

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
