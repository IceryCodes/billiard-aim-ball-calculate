import { Circle, Group, Text } from 'react-konva';

interface MarkPointProps {
  x: number;
  y: number;
  label: string;
  showMark: boolean;
  showDot: boolean;
  textSize: number;
  color: string;
  offsetX?: number;
}

const MarkPoint: React.FC<MarkPointProps> = ({ x, y, label, showMark, showDot, textSize, color, offsetX = 10 }) => {
  return (
    <Group>
      {showDot && <Circle x={x} y={y} radius={4} fill={color} />}
      {showMark && (
        <Text
          x={x + offsetX}
          y={y - textSize / 2}
          text={label}
          fontSize={textSize}
          fontFamily="Noto Sans TC"
          fontStyle="200"
          fill={color}
        />
      )}
    </Group>
  );
};

export default MarkPoint;
