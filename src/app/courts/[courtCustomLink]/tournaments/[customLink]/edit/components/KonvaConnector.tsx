'use client';

import React from 'react';

import { Group, Line } from 'react-konva';

import { connectionLineColor, connectionLineWidth, connectorHorizontalOffset } from './constants';
import { KonvaConnectorProps } from './interfaces';

const KonvaConnector: React.FC<KonvaConnectorProps> = ({ fromX, fromY, toX, toY }) => {
  const midX = fromX + connectorHorizontalOffset;

  return (
    <Group>
      {/* 水平線 */}
      <Line points={[fromX, fromY, midX, fromY]} stroke={connectionLineColor} strokeWidth={connectionLineWidth} />
      {/* 垂直線 */}
      <Line points={[midX, fromY, midX, toY]} stroke={connectionLineColor} strokeWidth={connectionLineWidth} />
      {/* 連接線 */}
      <Line points={[midX, toY, toX, toY]} stroke={connectionLineColor} strokeWidth={connectionLineWidth} />
    </Group>
  );
};

export default KonvaConnector;
