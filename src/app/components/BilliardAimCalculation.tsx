import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Circle, Group, Layer, Line, Stage, Text } from 'react-konva';

import { Button, ButtonStyleType } from '@/global-components/buttons/Button';
import Slider from '@/global-components/sliders/Slider';
import Tooltip from '@/global-components/tooltips/Tooltip';

import type { TextSizeProps } from '../Interface';

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

// 標記點組件
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

const BilliardAimCalculation: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [dimensions, setDimensions] = useState({ width: 720, height: 480 });
  const [positionRangeValue, setPositionRangeValue] = useState<number>(0.5);
  const [showLabel, setShowLabel] = useState<boolean>(true);
  const [showMark, setShowMark] = useState<boolean>(true);
  const [showDot, setShowDot] = useState<boolean>(true);
  const [textSize, setTextSize] = useState<TextSizeProps>({
    label: 12,
    angle: 10,
    mark: 16,
  });

  // 處理響應式尺寸
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // 確保有足夠寬度顯示兩個視角
        const width = Math.max(containerWidth * 0.95, 300); // 設定最小寬度
        const height = Math.max((width * 2) / 3, 350); // 調整比例，並設定最小高度
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const calculatePositions = useCallback(() => {
    // 增加邊距來防止裁切
    const margin = 40;
    const width = dimensions.width - margin * 2;
    const height = dimensions.height - margin * 2;
    // 調整計算方式來確保兩個視角都能完整顯示
    const r = Math.min(width / 8, height / 6) / 2;
    const paddingText = 10;

    // 調整位置計算，給左右兩側留出更多空間
    const centerX = width / 2.5; // 將中心點稍微往左移
    const spacing = width / 3; // 兩個視角之間的間距

    const cueBallPos = {
      x: centerX,
      y: height / 2 + 3 * 2 * r,
    };

    const targetBallPos = {
      x: centerX,
      y: height / 2,
    };

    const shadowBallPos = {
      x: centerX,
      y: targetBallPos.y + 2 * r,
    };

    const shandowBallY = Math.sqrt((2 * r) ** 2 - (positionRangeValue * 2 * r) ** 2);
    const sinAngle = shandowBallY / (2 * r);
    const cosAngle = (positionRangeValue * 2 * r) / (2 * r);

    shadowBallPos.x = centerX + positionRangeValue * 2 * r;
    shadowBallPos.y = targetBallPos.y + shandowBallY;

    const angleDisplayPos = {
      x: shadowBallPos.x + r * cosAngle,
      y: shadowBallPos.y + r * sinAngle,
      text: ~~((Math.asin(cosAngle) * 180) / Math.PI),
    };

    const predictTargetBallPos = {
      y: targetBallPos.y - 2 * 2 * r * sinAngle,
      x: targetBallPos.x - 2 * 2 * r * cosAngle,
    };

    const frontViewTargetBallPos = {
      x: centerX + spacing, // 使用固定間距而不是相對於球的大小
      y: height / 2,
    };

    const frontViewShadowBallPos = {
      x: centerX + spacing + positionRangeValue * 2 * r,
      y: height / 2,
    };

    cueBallPos.x = centerX + positionRangeValue * 2 * r;

    return {
      r,
      width,
      height,
      paddingText,
      cueBallPos,
      targetBallPos,
      shadowBallPos,
      angleDisplayPos,
      predictTargetBallPos,
      frontViewTargetBallPos,
      frontViewShadowBallPos,
    };
  }, [dimensions, positionRangeValue]);

  const positions = calculatePositions();

  const textSizeScale = (scaleUp: boolean) => {
    if (scaleUp) {
      setTextSize({
        label: textSize.label + 1,
        angle: textSize.angle + 1,
        mark: textSize.mark + 1,
      });
    } else {
      setTextSize({
        label: textSize.label - 1,
        angle: textSize.angle - 1,
        mark: textSize.mark - 1,
      });
    }
  };

  const handlePositionChange = useCallback((value: number) => {
    setPositionRangeValue(value);
  }, []);

  return (
    <section className="bg-foreground p-4 rounded-2xl flex flex-col items-center gap-y-2" ref={containerRef}>
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

      {/* Controller */}
      <div className="flex flex-row gap-x-4 items-center mt-4">
        <Button
          onClick={() => textSizeScale(true)}
          element={<>A</>}
          className="bg-link hover:scale-105 text-background px-4 py-2 rounded-lg text-center"
        />
        <Button
          onClick={() => textSizeScale(false)}
          element={<>A</>}
          className="bg-link hover:scale-105 text-background px-3 py-1 rounded-lg text-center text-sm"
        />
        <input type="checkbox" checked={showLabel} onChange={() => setShowLabel(!showLabel)} />
        <span className="text-background">文字</span>
        <input type="checkbox" checked={showMark} onChange={() => setShowMark(!showMark)} />
        <span className="text-background">記號</span>
        <input type="checkbox" checked={showDot} onChange={() => setShowDot(!showDot)} />
        <span className="text-background">圓點</span>
      </div>

      {/* Angle Slider */}
      <section
        style={{
          backgroundColor: 'white',
          borderRadius: 5,
          height: 20,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={positionRangeValue}
          defaultValue={0.5}
          onChange={handlePositionChange}
          style={{ width: 330 }}
        />
      </section>

      {/* Quick Select Buttons */}
      <div className="flex flex-row gap-4">
        <Tooltip placement="bottom" title="直球">
          <Button
            buttonStyle={positionRangeValue === 0 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            onClick={() => setPositionRangeValue(0)}
            text="0°"
          />
        </Tooltip>
        <Tooltip placement="bottom" title="半顆">
          <Button
            buttonStyle={positionRangeValue === 0.5 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            onClick={() => setPositionRangeValue(0.5)}
            text="30°"
          />
        </Tooltip>
        <Tooltip placement="bottom" title="好打">
          <Button
            buttonStyle={positionRangeValue === 0.71 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            onClick={() => setPositionRangeValue(0.71)}
            text="45°"
          />
        </Tooltip>
        <Tooltip placement="bottom" title="難打">
          <Button
            buttonStyle={positionRangeValue === 0.87 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            onClick={() => setPositionRangeValue(0.87)}
            text="60°"
          />
        </Tooltip>
        <Tooltip placement="bottom" title="倚天切">
          <Button
            buttonStyle={positionRangeValue === 1 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            onClick={() => setPositionRangeValue(1)}
            text="90°"
          />
        </Tooltip>
      </div>
    </section>
  );
};

export default BilliardAimCalculation;
