import { Group, Layer, Line, Stage, Text } from 'react-konva';

import Ball from './Ball';
import { DimensionsProps, PositionsProps, TextSizeProps } from './interfaces';
import MarkPoint from './MarkPoint';

interface AimViewProps {
  dimensions: DimensionsProps;
  positions: PositionsProps;
  showLabel: boolean;
  textSize: TextSizeProps;
  showMark: boolean;
  showDot: boolean;
}

const AimView: React.FC<AimViewProps> = ({ dimensions, positions, showLabel, textSize, showMark, showDot }) => {
  return (
    <Stage
      width={dimensions.width}
      height={dimensions.height}
      className="border-4 border-background rounded-2xl max-w-[350px] md:max-w-[800px]"
    >
      <Layer>
        {/* 上帝視角 Group */}
        <Group>
          {/* 標題 */}
          <Text
            x={positions.targetBallPos.x - 40}
            y={10}
            text="上帝視角"
            fontSize={16}
            fontStyle="bold"
            fontFamily="sans-serif"
            fill="black"
            width={80}
            align="center"
          />

          {/* 目標球 */}
          <Ball
            x={positions.targetBallPos.x}
            y={positions.targetBallPos.y}
            radius={positions.r}
            label="目標球"
            showLabel={showLabel}
            textSize={textSize.label}
            strokeColor="green"
            labelOffset={positions.paddingText}
          />

          {/* 目標點 */}
          <Ball
            x={positions.predictTargetBallPos.x}
            y={positions.predictTargetBallPos.y}
            radius={positions.r}
            label="目標點"
            showLabel={showLabel}
            textSize={textSize.label}
            strokeColor="blue"
            labelOffset={positions.paddingText}
          />

          {/* 母球 */}
          <Ball
            x={positions.cueBallPos.x}
            y={positions.cueBallPos.y}
            radius={positions.r}
            label="母球"
            showLabel={showLabel}
            textSize={textSize.label}
            strokeColor="black"
            labelOffset={positions.paddingText}
          />

          {/* 假想球 */}
          <Ball
            x={positions.shadowBallPos.x}
            y={positions.shadowBallPos.y}
            radius={positions.r}
            label="假想球"
            showLabel={showLabel}
            textSize={textSize.label}
            strokeColor="black"
            isDashed={true}
            labelOffset={positions.paddingText}
          />

          {/* 連線 */}
          <Line
            points={[positions.cueBallPos.x, positions.cueBallPos.y, positions.shadowBallPos.x, positions.targetBallPos.y]}
            stroke="black"
            strokeWidth={1}
          />
          <Line
            points={[
              positions.targetBallPos.x,
              positions.targetBallPos.y,
              positions.angleDisplayPos.x,
              positions.angleDisplayPos.y,
            ]}
            stroke="green"
            strokeWidth={1}
          />
          <Line
            points={[
              positions.targetBallPos.x,
              positions.targetBallPos.y,
              positions.predictTargetBallPos.x,
              positions.predictTargetBallPos.y,
            ]}
            stroke="blue"
            strokeWidth={1}
          />

          {/* 角度文字 */}
          <Text
            x={positions.angleDisplayPos.x + positions.paddingText}
            y={positions.angleDisplayPos.y - textSize.angle / 2}
            text={`${positions.angleDisplayPos.text}°`}
            fontSize={textSize.angle}
            fontFamily="Noto Sans TC"
            fontStyle="200"
            fill="black"
          />

          {/* 標記點 A, B, C */}
          <MarkPoint
            x={positions.targetBallPos.x + (positions.shadowBallPos.x - positions.targetBallPos.x) / 2}
            y={positions.targetBallPos.y + (positions.shadowBallPos.y - positions.targetBallPos.y) / 2}
            label="A"
            showMark={showMark}
            showDot={showDot}
            textSize={textSize.mark}
            color="red"
            offsetX={positions.paddingText}
          />
          <MarkPoint
            x={positions.targetBallPos.x + positions.r}
            y={positions.targetBallPos.y}
            label="B"
            showMark={showMark}
            showDot={showDot}
            textSize={textSize.mark}
            color="green"
            offsetX={positions.paddingText}
          />
          <MarkPoint
            x={positions.shadowBallPos.x - positions.r}
            y={positions.targetBallPos.y}
            label="C"
            showMark={showMark}
            showDot={showDot}
            textSize={textSize.mark}
            color="blue"
            offsetX={-positions.paddingText - 10}
          />
        </Group>

        {/* 瞄球視角 Group */}
        <Group>
          {/* 標題 */}
          <Text
            x={positions.frontViewTargetBallPos.x - 35}
            y={10}
            text="瞄球視角"
            fontSize={16}
            fontStyle="bold"
            fontFamily="sans-serif"
            fill="black"
            width={80}
            align="center"
          />

          {/* 目標球 */}
          <Ball
            x={positions.frontViewTargetBallPos.x}
            y={positions.frontViewTargetBallPos.y}
            radius={positions.r}
            label=""
            showLabel={false}
            textSize={textSize.label}
            strokeColor="green"
          />

          {/* 假想球 */}
          <Ball
            x={positions.frontViewShadowBallPos.x}
            y={positions.frontViewShadowBallPos.y}
            radius={positions.r}
            label=""
            showLabel={false}
            textSize={textSize.label}
            strokeColor="black"
            isDashed={true}
          />

          {/* 正視圖直線 */}
          <Line
            points={[
              positions.frontViewTargetBallPos.x,
              positions.frontViewTargetBallPos.y - positions.r - positions.paddingText / 2,
              positions.frontViewTargetBallPos.x,
              positions.frontViewTargetBallPos.y + positions.r + positions.paddingText / 2,
            ]}
            stroke="green"
            strokeWidth={1}
          />
          <Line
            points={[
              positions.frontViewShadowBallPos.x,
              positions.frontViewTargetBallPos.y - positions.r - positions.paddingText / 2,
              positions.frontViewShadowBallPos.x,
              positions.frontViewTargetBallPos.y + positions.r + positions.paddingText / 2,
            ]}
            stroke="black"
            strokeWidth={1}
          />

          {/* 正視圖標記點 A, B, C */}
          <MarkPoint
            x={
              positions.frontViewTargetBallPos.x +
              (positions.frontViewShadowBallPos.x - positions.frontViewTargetBallPos.x) / 2
            }
            y={positions.frontViewTargetBallPos.y}
            label="A"
            showMark={showMark}
            showDot={showDot}
            textSize={textSize.mark}
            color="red"
            offsetX={positions.paddingText}
          />
          <MarkPoint
            x={positions.frontViewTargetBallPos.x + positions.r}
            y={positions.frontViewTargetBallPos.y}
            label="B"
            showMark={showMark}
            showDot={showDot}
            textSize={textSize.mark}
            color="green"
            offsetX={positions.paddingText}
          />
          <MarkPoint
            x={positions.frontViewShadowBallPos.x - positions.r}
            y={positions.frontViewShadowBallPos.y}
            label="C"
            showMark={showMark}
            showDot={showDot}
            textSize={textSize.mark}
            color="blue"
            offsetX={-positions.paddingText - 10}
          />
        </Group>
      </Layer>
    </Stage>
  );
};

export default AimView;
