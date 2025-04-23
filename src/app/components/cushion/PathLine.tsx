import React from 'react';

import { Line } from 'react-konva';

interface PathLineProps {
  points: number[];
  strokeWidth: number;
  stroke: string;
}

const PathLine: React.FC<PathLineProps> = (props) => {
  if (!props || !props.points) return null;
  const { points, strokeWidth, stroke } = props;

  if (points.length < 4) return null; // 至少需要兩個點才能畫線

  return <Line points={points} stroke={stroke} strokeWidth={strokeWidth} lineCap="round" lineJoin="round" />;
};

export default PathLine;
