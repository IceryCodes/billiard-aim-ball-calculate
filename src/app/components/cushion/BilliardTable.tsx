import React from 'react';

import { Group, Image, Text } from 'react-konva';
import useImage from 'use-image';

import { TableMarker } from './interfaces';

interface BilliardTableProps {
  width: number;
  height: number;
  tableDimensions: {
    cushionWidth: number;
    innerPadding: number;
    pocketRadius: number;
  };
  displayMarkers: boolean;
  reverseMarkers: boolean;
}

// 兩顆星數字標記
const tableMarkers: TableMarker[] = [
  // 頂部標記
  { position: 'top', value: '0', offset: 0 },
  { position: 'top', value: '1', offset: 0.135 },
  { position: 'top', value: '2', offset: 0.255 },
  { position: 'top', value: '3', offset: 0.375 },
  { position: 'top', value: '4', offset: 0.5 },
  { position: 'top', value: '5', offset: 0.625 },
  { position: 'top', value: '6', offset: 0.745 },
  { position: 'top', value: '7', offset: 0.868 },
  { position: 'top', value: '8', offset: 1 },
  // 底部標記
  { position: 'bottom', value: '1', offset: 0 },
  { position: 'bottom', value: '1.5', offset: 0.125 },
  { position: 'bottom', value: '2', offset: 0.255 },
  { position: 'bottom', value: '2.5', offset: 0.365 },
  { position: 'bottom', value: '3', offset: 0.5 },
  { position: 'bottom', value: '3.5', offset: 0.615 },
  { position: 'bottom', value: '4', offset: 0.745 },
  { position: 'bottom', value: '4.5', offset: 0.858 },
  { position: 'bottom', value: '5', offset: 1 },
  // 右邊標記
  { position: 'right', value: '8', offset: 0.26 },
  { position: 'right', value: '7', offset: 0.51 },
  { position: 'right', value: '6', offset: 0.752 },
  // 顛倒右邊標記
  { position: 'rightReverse', value: '6', offset: 0.26 },
  { position: 'rightReverse', value: '7', offset: 0.51 },
  { position: 'rightReverse', value: '8', offset: 0.752 },
];

const BilliardTable: React.FC<BilliardTableProps> = (props) => {
  // 使用 useImage hook 來載入圖片
  const [image] = useImage('/images/horizontal-billiards-table.png');

  if (!props || !props.width) return null;

  const { width, height, tableDimensions, displayMarkers, reverseMarkers } = props;

  return (
    <Group>
      {/* 使用 Konva Image 元件顯示圖片 */}
      <Image image={image} width={width} height={height} alt="horizontal billiards table" />

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
                offsetY={15}
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
                offsetY={-3}
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
                offsetX={-3}
                offsetY={7}
              />
            ))}
        </Group>
      )}
    </Group>
  );
};

export default BilliardTable;
