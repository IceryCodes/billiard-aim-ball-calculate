import { DrawingData, Match, Player, RealtimeMessageType, TournamentAction, TournamentState } from '@/domains/tournament';

// WebSocket 訊息的基礎類型
export interface BaseRealtimeMessage {
  type: RealtimeMessageType;
  timestamp?: string;
  fromUserId?: string;
  tournamentId?: string;
  broadcastCount?: number;
}

// 選手更新訊息 - 完整選手列表
export interface PlayerUpdateCompleteMessage extends BaseRealtimeMessage {
  type: RealtimeMessageType.PLAYER_UPDATE;
  data: {
    players: Player[];
    matches?: Match[];
    action?: TournamentAction;
  };
}

// 選手更新訊息 - 單個選手
export interface PlayerUpdateSingleMessage extends BaseRealtimeMessage {
  type: RealtimeMessageType.PLAYER_UPDATE;
  data: {
    playerId: number;
    playerName: string;
    action?: TournamentAction;
  };
}

// 比賽更新訊息
export interface MatchUpdateMessage extends BaseRealtimeMessage {
  type: RealtimeMessageType.MATCH_UPDATE;
  data: {
    matches: Match[];
    action?: TournamentAction;
  };
}

// 賽程更新訊息
export interface TournamentUpdatedMessage extends BaseRealtimeMessage {
  type: RealtimeMessageType.TOURNAMENT_UPDATED;
  data: {
    tournament?: Partial<TournamentState>;
    action?: TournamentAction;
    [key: string]: string | number | boolean | object | undefined;
  };
}

// 公告訊息
export interface AnnouncementMessage extends BaseRealtimeMessage {
  type: RealtimeMessageType.ANNOUNCEMENT;
  message: string;
  data?: Record<string, string | number | boolean | object>;
}

// 測試更新訊息
export interface TestUpdateMessage extends BaseRealtimeMessage {
  type: RealtimeMessageType.TEST_UPDATE;
  message: string;
  data?: Record<string, string | number | boolean | object>;
}

// 刷新請求訊息
export interface RefreshRequestMessage extends BaseRealtimeMessage {
  type: RealtimeMessageType.REFRESH_REQUEST;
  data?: Record<string, string | number | boolean | object>;
}

// 繪圖更新訊息
export interface DrawingUpdateMessage extends BaseRealtimeMessage {
  type: RealtimeMessageType.DRAWING_UPDATE;
  data: {
    drawingData: DrawingData;
    action: TournamentAction;
  };
}

// 聯合類型 - 所有可能的訊息類型
export type RealtimeMessage =
  | PlayerUpdateCompleteMessage
  | PlayerUpdateSingleMessage
  | MatchUpdateMessage
  | TournamentUpdatedMessage
  | AnnouncementMessage
  | TestUpdateMessage
  | RefreshRequestMessage
  | DrawingUpdateMessage;

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

// 廣播更新資料類型
export type BroadcastUpdateData =
  | {
      type: RealtimeMessageType.PLAYER_UPDATE;
      data: {
        playerId?: number;
        playerName?: string;
        players?: Player[];
        matches?: Match[];
        action?: TournamentAction;
        [key: string]: string | number | boolean | object | undefined;
      };
      action?: TournamentAction;
    }
  | {
      type: RealtimeMessageType.MATCH_UPDATE;
      data: {
        matches: Match[];
        action?: TournamentAction;
        [key: string]: string | number | boolean | object | undefined;
      };
      action?: TournamentAction;
    }
  | {
      type: RealtimeMessageType.TOURNAMENT_UPDATED;
      data?: {
        tournament?: Partial<TournamentState>;
        action?: TournamentAction;
        [key: string]: string | number | boolean | object | undefined;
      };
      action?: TournamentAction;
    }
  | {
      type: RealtimeMessageType.ANNOUNCEMENT;
      message: string;
    }
  | {
      type: RealtimeMessageType.TEST_UPDATE;
      message: string;
    }
  | {
      type: RealtimeMessageType.REFRESH_REQUEST;
    }
  | {
      type: RealtimeMessageType.DRAWING_UPDATE;
      data: {
        drawingData: DrawingData;
        action: TournamentAction;
      };
      action: TournamentAction;
    };
