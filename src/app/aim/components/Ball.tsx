'use client';

import { Circle, Group, Text } from 'react-konva';

interface BallProps {
  x: number;
  y: number;
  radius: number;
  label: string;
  showLabel: boolean;
  textSize: number;
  strokeColor: string;
  isDashed?: boolean;
  labelOffset?: number;
}

const Ball: React.FC<BallProps> = ({
  x,
  y,
  radius,
  label,
  showLabel,
  textSize,
  strokeColor,
  isDashed = false,
  labelOffset = 15,
}) => {
  return (
    <Group>
      <Circle x={x} y={y} radius={radius} stroke={strokeColor} strokeWidth={1} dash={isDashed ? [2, 3] : undefined} />
      <Circle x={x} y={y} radius={2} fill="black" />
      {showLabel && (
        <Text
          x={x - radius - labelOffset - 15}
          y={y - textSize / 2}
          text={label}
          fontSize={textSize}
          fontFamily="Noto Sans TC"
          fontStyle="200"
          fill="black"
        />
      )}
    </Group>
  );
};

export default Ball;
