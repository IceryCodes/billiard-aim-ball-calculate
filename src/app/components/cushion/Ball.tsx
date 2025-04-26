'use client';

import React from 'react';

import { Circle, Group } from 'react-konva';

import { BallType } from './interfaces';

interface BallProps {
  ball: BallType;
  onDrag?: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
}

const Ball: React.FC<BallProps> = ({ ball, onDrag, onDragEnd }) => {
  if (!ball) return null;

  // 完全符合參考圖的球的顏色
  const getExactColor = (baseColor: string) => {
    if (baseColor === 'white') return '#FFFFFF'; // 純白色母球
    if (baseColor === 'red') return '#FF0000'; // 純紅色目標球
    if (baseColor === 'rgba(0,0,0,0.3)') return 'rgba(0,0,0,0.3)'; // 半透明虛擬球
    if (baseColor === '#101010') return '#101010'; // 黑色障礙球
    return baseColor;
  };

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
      {/* 主球體 - 根據參考圖簡化設計，移除多餘效果 */}
      <Circle
        radius={ball.radius}
        fill={getExactColor(ball.color)}
        strokeWidth={ball.isDashed ? 1 : 0}
        stroke={ball.isDashed ? 'white' : undefined}
        dash={ball.isDashed ? [3, 2] : undefined}
        opacity={ball.isDashed ? 0.6 : 1}
      />
    </Group>
  );
};

export default Ball;
