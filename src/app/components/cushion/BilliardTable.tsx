import React from 'react';

import { Circle, Group, Line, Rect, Text } from 'react-konva';

import { TableDimensions, TableMarker } from './interfaces';

interface BilliardTableProps {
  width: number;
  height: number;
  tableDimensions: TableDimensions;
  displayMarkers: boolean;
  reverseMarkers: boolean;
}

// 兩顆星數字標記
const tableMarkers: TableMarker[] = [
  // 頂部標記
  { position: 'top', value: '0', offset: 0 },
  { position: 'top', value: '1', offset: 0.125 },
  { position: 'top', value: '2', offset: 0.25 },
  { position: 'top', value: '3', offset: 0.375 },
  { position: 'top', value: '4', offset: 0.5 },
  { position: 'top', value: '5', offset: 0.625 },
  { position: 'top', value: '6', offset: 0.75 },
  { position: 'top', value: '7', offset: 0.875 },
  { position: 'top', value: '8', offset: 1 },
  // 底部標記
  { position: 'bottom', value: '1', offset: 0 },
  { position: 'bottom', value: '1.5', offset: 0.125 },
  { position: 'bottom', value: '2', offset: 0.25 },
  { position: 'bottom', value: '2.5', offset: 0.375 },
  { position: 'bottom', value: '3', offset: 0.5 },
  { position: 'bottom', value: '3.5', offset: 0.625 },
  { position: 'bottom', value: '4', offset: 0.75 },
  { position: 'bottom', value: '4.5', offset: 0.875 },
  { position: 'bottom', value: '5', offset: 1 },
  // 右邊標記
  { position: 'right', value: '8', offset: 0.255 },
  { position: 'right', value: '7', offset: 0.505 },
  { position: 'right', value: '6', offset: 0.755 },
  // 顛倒右邊標記
  { position: 'rightReverse', value: '6', offset: 0.255 },
  { position: 'rightReverse', value: '7', offset: 0.505 },
  { position: 'rightReverse', value: '8', offset: 0.755 },
];

const BilliardTable: React.FC<BilliardTableProps> = (props) => {
  if (!props || !props.width) return null;
  const { width, height, tableDimensions, displayMarkers, reverseMarkers } = props;

  const TABLE_RADIUS = 20;

  // 角落袋的位置
  const cornerPockets = [
    { x: tableDimensions.cushionWidth, y: tableDimensions.cushionWidth }, // 左上
    { x: width - tableDimensions.cushionWidth, y: tableDimensions.cushionWidth }, // 右上
    { x: tableDimensions.cushionWidth, y: height - tableDimensions.cushionWidth }, // 左下
    { x: width - tableDimensions.cushionWidth, y: height - tableDimensions.cushionWidth }, // 右下
  ];

  // 中袋的位置
  const sidePockets = [
    { x: width / 2, y: tableDimensions.cushionWidth - 5 }, // 上側中央
    { x: width / 2, y: height - tableDimensions.cushionWidth + 5 }, // 下側中央
  ];

  // 顆星的位置生成函數
  const generateDotPositions = (start: { x: number; y: number }, end: { x: number; y: number }, count: number) => {
    const dots = [];
    for (let i = 1; i <= count; i++) {
      const x = start.x + (end.x - start.x) * (i / (count + 1));
      const y = start.y + (end.y - start.y) * (i / (count + 1));
      dots.push({ x, y });
    }
    return dots;
  };

  // 生成邊線上的顆星
  const rightEdgeDots = generateDotPositions(cornerPockets[1], cornerPockets[3], 3);
  const leftEdgeDots = generateDotPositions(cornerPockets[2], cornerPockets[0], 3);
  const topEdgeDots = generateDotPositions(
    { x: tableDimensions.cushionWidth, y: sidePockets[0].y + 5 },
    { x: width - tableDimensions.cushionWidth, y: sidePockets[0].y + 5 },
    7
  );
  const bottomEdgeDots = generateDotPositions(
    { x: tableDimensions.cushionWidth, y: sidePockets[1].y - 5 },
    { x: width - tableDimensions.cushionWidth, y: sidePockets[1].y - 5 },
    7
  );

  return (
    <Group>
      {/* 外框 */}
      <Rect x={0} y={0} width={width} height={height} fill="#262626" cornerRadius={TABLE_RADIUS} />

      {/* 主區域 */}
      <Rect
        x={tableDimensions.cushionWidth}
        y={tableDimensions.cushionWidth}
        width={width - 2 * tableDimensions.cushionWidth}
        height={height - 2 * tableDimensions.cushionWidth}
        fill="#0084D9"
      />

      {/* 內區域（淺藍色部分） */}
      <Rect
        x={tableDimensions.cushionWidth + tableDimensions.innerPadding}
        y={tableDimensions.cushionWidth + tableDimensions.innerPadding}
        width={width - 2 * tableDimensions.cushionWidth - 2 * tableDimensions.innerPadding}
        height={height - 2 * tableDimensions.cushionWidth - 2 * tableDimensions.innerPadding}
        fill="#0093F3"
      />

      {/* 角落袋 */}
      {cornerPockets.map((pocket, index) => (
        <Circle
          key={`corner-pocket-${index}`}
          x={pocket.x}
          y={pocket.y}
          radius={tableDimensions.pocketRadius}
          fill="#262626"
        />
      ))}

      {/* 中袋 */}
      {sidePockets.map((pocket, index) => (
        <Circle
          key={`side-pocket-${index}`}
          x={pocket.x}
          y={pocket.y}
          radius={tableDimensions.pocketRadius - 5}
          fill="#262626"
        />
      ))}

      {/* 邊線上的點 */}
      {[...rightEdgeDots, ...leftEdgeDots, ...topEdgeDots, ...bottomEdgeDots].map((dot, index) => (
        <Group key={`dot-${index}`}>
          <Line
            points={[dot.x, dot.y - 3, dot.x + 3, dot.y, dot.x, dot.y + 3, dot.x - 3, dot.y]}
            closed={true}
            fill="white"
          />
        </Group>
      ))}

      {/* 顯示標記 */}
      {displayMarkers && (
        <Group>
          {/* 頂部標記 */}
          {tableMarkers
            .filter((marker) => (!reverseMarkers ? marker.position === 'top' : marker.position === 'bottom'))
            .map((marker, index) => (
              <Text
                key={`top-marker-${index}`}
                x={tableDimensions.cushionWidth + (width - 2 * tableDimensions.cushionWidth) * marker.offset}
                y={tableDimensions.cushionWidth / 2}
                text={marker.value}
                fill="red"
                fontSize={16}
                fontStyle="bold"
                align="center"
                verticalAlign="middle"
                offsetX={5}
                offsetY={5}
              />
            ))}

          {/* 底部標記 */}
          {tableMarkers
            .filter((marker) => (!reverseMarkers ? marker.position === 'bottom' : marker.position === 'top'))
            .map((marker, index) => (
              <Text
                key={`bottom-marker-${index}`}
                x={tableDimensions.cushionWidth + (width - 2 * tableDimensions.cushionWidth) * marker.offset}
                y={height - tableDimensions.cushionWidth / 2}
                text={marker.value}
                fill="red"
                fontSize={16}
                fontStyle="bold"
                align="center"
                verticalAlign="middle"
                offsetX={5}
                offsetY={5}
              />
            ))}

          {/* 右側標記 */}
          {tableMarkers
            .filter((marker) => (!reverseMarkers ? marker.position === 'right' : marker.position === 'rightReverse'))
            .map((marker, index) => (
              <Text
                key={`right-marker-${index}`}
                x={width - tableDimensions.cushionWidth / 2}
                y={tableDimensions.cushionWidth + (height - 2 * tableDimensions.cushionWidth) * marker.offset}
                text={marker.value}
                fill="red"
                fontSize={16}
                fontStyle="bold"
                align="center"
                verticalAlign="middle"
                offsetY={7}
              />
            ))}
        </Group>
      )}
    </Group>
  );
};

export default BilliardTable;
