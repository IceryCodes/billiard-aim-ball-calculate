export interface BallType {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  draggable: boolean;
  isDashed?: boolean;
}

export interface TableMarker {
  position: 'top' | 'bottom' | 'right' | 'rightReverse' | 'left' | 'leftReverse';
  value: string;
  offset: number;
}

export interface PathPoint {
  x: number;
  y: number;
}

export interface TableDimensions {
  width: number;
  height: number;
  cushionWidth: number;
  pocketRadius: number;
  innerPadding: number;
}

export enum MarkerType {
  NONE = 0,
  KO = 1,
  OTHER = 2,
}

export enum EnglishType {
  NONE = 0,
  LEFT = 1,
  RIGHT = -1,
}
