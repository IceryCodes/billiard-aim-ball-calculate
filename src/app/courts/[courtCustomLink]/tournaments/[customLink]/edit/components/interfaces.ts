import {
  BroadcastTestType,
  Gamer,
  GamerCount,
  Match,
  ToastNotification,
  TournamentProps,
  TournamentType,
} from '@/domains/tournament';

import { EditMode } from './constants';

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

// 組件 Props 介面
export interface EditableGamerProps {
  gamer: Gamer;
  onNameChange: (id: number, name: string) => void;
  onDragStart: (gamer: Gamer) => void;
  className?: string;
}

export interface KonvaMatchProps {
  match: Match;
  x: number;
  y: number;
  isEditMode: boolean;
  onGamerClick: (matchId: string, gamer: Gamer) => void;
}

export interface KonvaConnectorProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface SingleEliminationKonvaProps {
  gamers: Gamer[];
  matches: Match[];
  isEditMode: boolean;
  onMatchUpdate?: (matches: Match[]) => void;
  drawingData?: DrawingData;
  onDrawingUpdate?: (drawingData: DrawingData) => void;
  editMode?: EditMode;
  onGamerNameEdit?: (gamerId: number, newName: string) => void;
  onGamerGamesEdit?: (gamerId: number, newGames: number) => void;
}

export interface GamerEditState {
  gamerId: number | null;
  tempName: string;
  isEditing: boolean;
}

export enum ConnectionQualityType {
  GOOD = 'good',
  POOR = 'poor',
  DISCONNECTED = 'disconnected',
}

// 狀態欄組件介面
export interface TournamentStatusBarProps {
  isConnected: boolean;
  onlineCount: number;
  tournament: TournamentProps;
  refetch: () => void;
  connectionQuality: ConnectionQualityType;
  lastUpdateTime?: string;
  isEditMode?: boolean;
  reconnect?: () => void;
}

// Toast 組件介面
export interface TournamentToastProps {
  toast: ToastNotification | null;
}

// 賽程表顯示組件介面
export interface TournamentDisplayProps {
  tournamentData: TournamentProps;
  onMatchUpdate?: (matches: Match[]) => void;
  isEditMode?: boolean;
  drawingData?: DrawingData;
  onDrawingUpdate?: (drawingData: DrawingData) => void;
  onGamerNameEdit?: (gamerId: number, newName: string) => void;
  onGamerGamesEdit?: (gamerId: number, newGames: number) => void;
  connectionQuality: ConnectionQualityType;
}

// 響應式警告組件介面
export interface ResponsiveWarningProps {
  windowWidth: number;
}

// 編輯控制組件介面
export interface TournamentControlsProps {
  isConnected: boolean;
  onlineCount: number;
  onTestBroadcast: (testType: BroadcastTestType) => void;
  connectionQuality: ConnectionQualityType;
}

// Hook 參數介面
export interface UseTournamentStateProps {
  tournamentData: import('@/domains/tournament').TournamentProps;
  updateTournament?: (tournament: import('@/domains/tournament').UpdateTournamentDto) => void;
  refetchTournament?: () => void;
  isEditMode?: boolean;
}

// Hook 返回值介面
export interface UseTournamentStateReturn {
  currentTournament: import('@/domains/tournament').TournamentProps;
  toast: ToastNotification | null;
  windowWidth: number;
  lastUpdateTime: string;
  isConnected: boolean;
  onlineCount: number;
  reconnect: () => void;
  handleGamerNameChange: (id: number, name: string) => Promise<void>;
  handleGamerCountChange: (count: GamerCount) => Promise<void>;
  handleGamerGamesChange: (gamerId: number, newGames: number) => Promise<void>;
  handleTournamentTypeChange: (type: TournamentType) => Promise<void>;
  handleMatchUpdate: (matches: Match[]) => Promise<void>;
  handleTestBroadcast: (testType: BroadcastTestType) => Promise<void>;
  drawingData: DrawingData;
  handleDrawingUpdate: (drawingData: DrawingData) => Promise<void>;
  connectionQuality: ConnectionQualityType;
}
