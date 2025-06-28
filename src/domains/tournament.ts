import { ObjectId } from 'mongodb';

export enum TournamentType {
  SINGLE = 'single',
  DOUBLE = 'double',
}

export enum GamerCount {
  THIRTY_TWO = 32,
  SIXTY_FOUR = 64,
  ONE_HUNDRED_AND_TWENTY_EIGHT = 128,
}

export enum UserType {
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export enum ToastType {
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  INFO = 'info',
  ANNOUNCEMENT = 'announcement',
}

export enum RealtimeMessageType {
  GAMER_UPDATE = 'gamerUpdate',
  MATCH_UPDATE = 'matchUpdate',
  TOURNAMENT_UPDATED = 'tournamentUpdated',
  ANNOUNCEMENT = 'announcement',
  TEST_UPDATE = 'testUpdate',
  REFRESH_REQUEST = 'refreshRequest',
  DRAWING_UPDATE = 'drawingUpdate',
}

export enum BroadcastTestType {
  ANNOUNCEMENT = 'announcement',
  TEST_UPDATE = 'testUpdate',
  REFRESH_REQUEST = 'refreshRequest',
}

export enum TournamentAction {
  GAMER_NAME_CHANGED = 'gamer_name_changed',
  GAMER_COUNT_CHANGED = 'gamer_count_changed',
  TOURNAMENT_TYPE_CHANGED = 'tournament_type_changed',
  MATCH_RESULT_UPDATED = 'match_result_updated',
  DRAWING_UPDATED = 'drawing_updated',
}

// 繪圖相關介面
export interface DrawingLine {
  id: string;
  points: number[];
  strokeWidth: number;
  stroke: string;
  timestamp: number;
}

export interface DrawingData {
  lines: DrawingLine[];
  lastUpdated: number;
}

// 基礎類型定義
export interface Gamer {
  id: number;
  name: string;
  games: number;
}

export interface Match {
  id: string;
  gamer1: Gamer | null;
  gamer2: Gamer | null;
  winner: Gamer | null;
  round: number;
  matchIndex: number;
}

export interface TournamentState {
  gamers: Gamer[];
  matches: Match[];
  tournamentType: TournamentType;
  gamerCount: GamerCount;
}

export interface GetTournamentDto {
  customLink: string;
}

export interface GetTournamentsDto {
  court?: string;
  page?: number;
  limit?: number;
}

export interface TournamentProps {
  _id: string;
  title: string;
  court: string;
  courtTitle: string;
  courtCustomLink: string;
  excerpt: string;
  content: string;
  featuredImg: string;
  customLink: string;
  tags: string[];
  tournament: TournamentState;
  drawingData?: DrawingData;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentDBProps extends Omit<TournamentProps, '_id' | 'courtCustomLink'> {
  _id: ObjectId;
}

export type UpdateTournamentDto = TournamentProps;

export type CreateTournamentProps = Omit<
  TournamentProps,
  '_id' | 'createdAt' | 'updatedAt' | 'featuredImg' | 'tags' | 'tournament' | 'drawingData'
>;

// Toast 相關類型
export interface ToastNotification {
  message: string;
  type: ToastType;
}

// 即時訊息相關類型
export interface BaseRealtimeMessage {
  type: RealtimeMessageType;
  fromUserId?: string;
  timestamp?: number;
}

export interface GamerUpdateMessage extends BaseRealtimeMessage {
  type: RealtimeMessageType.GAMER_UPDATE;
  data: {
    gamerId?: number;
    gamerName?: string;
    gamers?: Gamer[];
    matches?: Match[];
    action?: TournamentAction;
  };
}

export interface MatchUpdateMessage extends BaseRealtimeMessage {
  type: RealtimeMessageType.MATCH_UPDATE;
  data: {
    matches: Match[];
    action: TournamentAction;
  };
}

export interface TournamentUpdatedMessage extends BaseRealtimeMessage {
  type: RealtimeMessageType.TOURNAMENT_UPDATED;
  data: Partial<TournamentProps> & {
    action?: TournamentAction;
  };
}

export interface AnnouncementMessage extends BaseRealtimeMessage {
  type: RealtimeMessageType.ANNOUNCEMENT;
  message: string;
}

export interface TestUpdateMessage extends BaseRealtimeMessage {
  type: RealtimeMessageType.TEST_UPDATE;
  message: string;
}

export interface RefreshRequestMessage extends BaseRealtimeMessage {
  type: RealtimeMessageType.REFRESH_REQUEST;
}

export interface DrawingUpdateMessage extends BaseRealtimeMessage {
  type: RealtimeMessageType.DRAWING_UPDATE;
  data: {
    drawingData: DrawingData;
    action: TournamentAction;
  };
}

export type RealtimeMessage =
  | GamerUpdateMessage
  | MatchUpdateMessage
  | TournamentUpdatedMessage
  | AnnouncementMessage
  | TestUpdateMessage
  | RefreshRequestMessage
  | DrawingUpdateMessage;

// 廣播更新數據
export interface BroadcastUpdateData {
  type: RealtimeMessageType;
  data?: Record<string, string | number | boolean | object>;
  message?: string;
  action?: TournamentAction;
  fromUserId?: string;
}

// Hook 狀態介面
export interface TournamentHookState {
  currentTournament: TournamentProps;
  toast: ToastNotification | null;
  windowWidth: number;
  lastUpdateTime: string;
  isConnected: boolean;
  onlineCount: number;
}

// Hook 操作介面
export interface TournamentHookActions {
  reconnect: () => void;
  handleGamerNameChange: (id: number, name: string) => Promise<void>;
  handleGamerCountChange: (count: GamerCount) => Promise<void>;
  handleTournamentTypeChange: (type: TournamentType) => Promise<void>;
  handleMatchUpdate: (matches: Match[]) => Promise<void>;
  handleTestBroadcast: (testType: BroadcastTestType) => Promise<void>;
}

export type DeleteTournamentDto = Pick<TournamentProps, '_id'>;
