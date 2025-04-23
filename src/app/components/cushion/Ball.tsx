'use client';

import React from 'react';

import { Circle, Group } from 'react-konva';

import { BallType } from './BilliardCalculator';

interface BallProps {
  ball: BallType;
  onDrag?: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
}

const Ball: React.FC<BallProps> = ({ ball, onDrag, onDragEnd }) => {
  if (!ball) return null;

  const dragBoundFunc = (pos: { x: number; y: number }) => {
    if (onDrag) onDrag(pos.x, pos.y);

    return { x: ball.x, y: ball.y };
  };

  return (
    <Group
      x={ball.x}
      y={ball.y}
      draggable={ball.draggable}
      dragBoundFunc={dragBoundFunc}
      onDragEnd={(e) => {
        onDragEnd(e.target.x(), e.target.y());
      }}
    >
      <Circle
        radius={ball.radius}
        fill={ball.color}
        strokeWidth={ball.isDashed ? 2 : 0}
        stroke={ball.isDashed ? 'white' : undefined}
        dash={ball.isDashed ? [5, 3] : undefined}
        opacity={ball.isDashed ? 0.8 : 1}
      />
    </Group>
  );
};

export default Ball;
