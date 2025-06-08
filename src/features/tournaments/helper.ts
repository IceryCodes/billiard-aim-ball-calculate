import {
  AnnouncementMessage,
  MatchUpdateMessage,
  PlayerUpdateCompleteMessage,
  PlayerUpdateSingleMessage,
  RealtimeMessage,
  TestUpdateMessage,
  TournamentUpdatedMessage,
} from '@/domains/realtime';
import { RealtimeMessageType } from '@/domains/tournament';

// 從 realtime 域導入具體的訊息類型和聯合類型

// Type guard functions - 使用枚舉類型
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
