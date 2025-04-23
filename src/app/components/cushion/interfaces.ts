export interface BallType {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  draggable: boolean;
  isDashed?: boolean;
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

export interface TableMarker {
  position: 'top' | 'bottom' | 'right' | 'rightReverse';
  value: string;
  offset: number;
}
