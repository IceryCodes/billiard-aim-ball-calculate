import { Edge, Node } from '@xyflow/react';

import { Gamer, Match } from '@/domains/tournament';

export interface TournamentEdge extends Edge {
  sourceHandle?: string;
  targetHandle?: string;
}

export interface MatchNodeData extends Record<string, unknown> {
  match: Match;
  isEditMode: boolean;
  onGamerClick: (matchId: string, gamer: Gamer) => void;
  onGamesEdit?: (gamerId: number, newGames: number) => void;
  editMode: string;
  gamerEditState: {
    gamerId: number | null;
    tempName: string;
    isEditing: boolean;
  };
  onConfirmEdit: (newValue: string) => void;
  onCancelEdit: () => void;
  onGamerNameEdit?: (gamerId: number, newName: string) => void;
  onGamerGamesEdit?: (gamerId: number, newGames: number) => void;
  isDrawingMode?: boolean;
  totalRounds: number;
}

export interface ChampionNodeData extends Record<string, unknown> {
  champion: Gamer | null;
}

export interface RoundTitleNodeData extends Record<string, unknown> {
  roundNumber: number;
  totalRounds: number;
  title: string;
}

export type MatchNode = Node<MatchNodeData>;
export type ChampionNode = Node<ChampionNodeData>;
export type RoundTitleNode = Node<RoundTitleNodeData>;

export type TournamentNode = MatchNode | ChampionNode | RoundTitleNode;

export interface SingleEliminationReactFlowProps {
  gamers: Gamer[];
  matches: Match[];
  isEditMode: boolean;
  onMatchUpdate?: (matches: Match[]) => void;
  editMode?: string;
  onGamerNameEdit?: (gamerId: number, newName: string) => void;
  onGamerGamesEdit?: (gamerId: number, newGames: number) => void;
}

export interface SingleEliminationReactFlowRef {
  setOptimalView: () => void;
  setFullscreenView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setEditMode: (mode: string) => void;
}
