'use client';

import React from 'react';

import { Group, Line } from 'react-konva';

import { KonvaConnectorProps } from './interfaces';

const KonvaConnector: React.FC<KonvaConnectorProps> = ({ fromX, fromY, toX, toY }) => {
  const midX = fromX + 10;

  return (
    <Group>
      {/* 水平線 */}
      <Line points={[fromX, fromY, midX, fromY]} stroke="#f97316" strokeWidth={2} />
      {/* 垂直線 */}
      <Line points={[midX, fromY, midX, toY]} stroke="#f97316" strokeWidth={2} />
      {/* 連接線 */}
      <Line points={[midX, toY, toX, toY]} stroke="#f97316" strokeWidth={2} />
    </Group>
  );
};

export default KonvaConnector;
