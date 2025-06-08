export interface TextSizeProps {
  label: number;
  angle: number;
  mark: number;
}

export interface DimensionsProps {
  width: number;
  height: number;
}

export interface PositionsProps {
  r: number;
  width: number;
  height: number;
  paddingText: number;
  cueBallPos: {
    x: number;
    y: number;
  };
  targetBallPos: {
    x: number;
    y: number;
  };
  shadowBallPos: {
    x: number;
    y: number;
  };
  angleDisplayPos: {
    x: number;
    y: number;
    text: number;
  };
  predictTargetBallPos: {
    y: number;
    x: number;
  };
  frontViewTargetBallPos: {
    x: number;
    y: number;
  };
  frontViewShadowBallPos: {
    x: number;
    y: number;
  };
}
