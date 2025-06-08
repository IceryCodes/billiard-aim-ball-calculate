import { Match, Player, TournamentState } from '@/domains/tournament';

// WebSocket 訊息的基礎類型
export interface BaseRealtimeMessage {
  type: string;
  timestamp?: string;
  fromUserId?: string;
  tournamentId?: string;
  broadcastCount?: number;
}

// 選手更新訊息 - 完整選手列表
export interface PlayerUpdateCompleteMessage extends BaseRealtimeMessage {
  type: 'playerUpdate';
  data: {
    players: Player[];
    matches?: Match[];
  };
}

// 選手更新訊息 - 單個選手
export interface PlayerUpdateSingleMessage extends BaseRealtimeMessage {
  type: 'playerUpdate';
  data: {
    playerId: number;
    playerName: string;
  };
}

// 比賽更新訊息
export interface MatchUpdateMessage extends BaseRealtimeMessage {
  type: 'matchUpdate';
  data: {
    matches: Match[];
  };
}

// 賽事更新訊息
export interface TournamentUpdatedMessage extends BaseRealtimeMessage {
  type: 'tournamentUpdated';
  data: {
    tournament?: Partial<TournamentState>;
    action?: 'player_count_changed' | 'tournament_type_changed' | 'general_update';
    [key: string]: unknown;
  };
}

// 公告訊息
export interface AnnouncementMessage extends BaseRealtimeMessage {
  type: 'announcement';
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

// 測試更新訊息
export interface TestUpdateMessage extends BaseRealtimeMessage {
  type: 'testUpdate';
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

// 刷新請求訊息
export interface RefreshRequestMessage extends BaseRealtimeMessage {
  type: 'refreshRequest';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

// 聯合類型 - 所有可能的訊息類型
export type RealtimeMessage =
  | PlayerUpdateCompleteMessage
  | PlayerUpdateSingleMessage
  | MatchUpdateMessage
  | TournamentUpdatedMessage
  | AnnouncementMessage
  | TestUpdateMessage
  | RefreshRequestMessage;

// Toast 通知類型
export interface ToastNotification {
  message: string;
  type: 'success' | 'warning' | 'info' | 'announcement';
}

// Presence 追蹤資料
export interface PresenceData {
  userId: string;
  userType: 'editor' | 'viewer';
  joinTime: string;
}

// 廣播更新資料類型 - 更新以支援所有需要的組合
export type BroadcastUpdateData =
  | {
      type: 'playerUpdate';
      data: {
        playerId?: number;
        playerName?: string;
        players?: unknown;
        matches?: unknown;
        action?: string;
        [key: string]: unknown;
      };
      action?: string;
    }
  | {
      type: 'matchUpdate';
      data: {
        matches: unknown;
        action?: string;
        [key: string]: unknown;
      };
      action?: string;
    }
  | {
      type: 'tournamentUpdated';
      data?: {
        tournament?: unknown;
        action?: string;
        [key: string]: unknown;
      };
      action?: string;
    }
  | { type: 'announcement'; message: string }
  | { type: 'testUpdate'; message: string }
  | { type: 'refreshRequest' };
