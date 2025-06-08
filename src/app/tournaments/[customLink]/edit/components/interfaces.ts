// types.ts - 類型定義檔案

import { Match, Player } from '@/domains/tournament';

// 組件 Props 介面
export interface EditablePlayerProps {
  player: Player;
  onNameChange: (id: number, name: string) => void;
  onDragStart: (player: Player) => void;
  className?: string;
}

export interface KonvaMatchProps {
  match: Match;
  x: number;
  y: number;
  onPlayerClick: (matchId: string, player: Player) => void;
}

export interface KonvaConnectorProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface SingleEliminationKonvaProps {
  players: Player[];
  matches: Match[];
  onMatchUpdate?: (match: Match[]) => void;
}
