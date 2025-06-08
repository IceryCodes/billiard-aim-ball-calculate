'use client';

import type React from 'react';
import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';

import { PageType } from '@/domains/interface';
import { Button, ButtonStyleType } from '@/global-components/buttons/Button';
import Popup from '@/global-components/Popup';

import { DimensionsProps, PositionsProps, TextSizeProps } from '../interfaces';

import AimView from './AimView';
import ControlPanel from './ControlPanel';

const Tips = (): ReactElement => (
  <section className="min-w-80 flex flex-col gap-y-4">
    <div>
      <p>A: 撞擊接觸點</p>
      <p>B: 瞄球視角目標球邊緣</p>
      <p>C: 瞄球視角母球邊緣</p>
    </div>
    <p>※ 圖片可以直接複製</p>
  </section>
);

const AimCalculation: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [showTips, setShowTips] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<DimensionsProps>({ width: 720, height: 480 });
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

  const calculatePositions = useCallback((): PositionsProps => {
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

  const positions: PositionsProps = calculatePositions();

  return (
    <section className="flex flex-col items-center">
      <section className="flex flex-col items-center mt-[20px] mb-[30px] gap-4">
        <div className="flex flex-row items-center gap-4">
          <h1 className="text-2xl font-bold">{PageType.AIM}</h1>
          <Button onClick={() => setShowTips(true)} text="說明" buttonStyle={ButtonStyleType.Active} />
        </div>
      </section>

      <section className="bg-foreground p-4 rounded-2xl flex flex-col items-center gap-y-2" ref={containerRef}>
        {/* Aim View */}
        <AimView
          dimensions={dimensions}
          positions={positions}
          showLabel={showLabel}
          textSize={textSize}
          showMark={showMark}
          showDot={showDot}
        />

        {/* ControlPanel */}
        <ControlPanel
          showLabel={showLabel}
          setShowLabel={setShowLabel}
          showMark={showMark}
          setShowMark={setShowMark}
          showDot={showDot}
          setShowDot={setShowDot}
          textSize={textSize}
          setTextSize={setTextSize}
          positionRangeValue={positionRangeValue}
          setPositionRangeValue={setPositionRangeValue}
        />
      </section>

      <Popup title={`${PageType.AIM}說明`} display={showTips} onClose={() => setShowTips(false)}>
        <Tips />
      </Popup>
    </section>
  );
};

export default AimCalculation;
