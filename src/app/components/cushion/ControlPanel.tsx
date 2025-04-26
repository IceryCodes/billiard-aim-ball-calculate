import React, { useCallback, useState } from 'react';

import { Vector2d } from 'konva/lib/types';
import { InstagramEmbed, YouTubeEmbed } from 'react-social-media-embed';

import { Button, ButtonStyleType } from '@/global-components/buttons/Button';
import Popup from '@/global-components/Popup';
import Slider from '@/global-components/sliders/Slider';

import { EnglishType, MarkerType } from './interfaces';

interface ControlPanelProps {
  selectedCushions: number;
  setSelectedCushions: (cushions: number) => void;
  displayMarkers: MarkerType;
  setDisplayMarkers: (display: MarkerType) => void;
  reverseMarkers: boolean;
  setReverseMarkers: (reverse: boolean) => void;
  pathWidth: number;
  setPathWidth: (width: number) => void;
  englishValue: EnglishType;
  setEnglishValue: (value: EnglishType) => void;
  spinValue: number;
  setSpinValue: (value: number) => void;
  strengthValue: number;
  setStrengthValue: (value: number) => void;
  onClearObstacles: () => void;
  calculatePath: () => void;
  handleAddBlockBall: (pos?: Vector2d) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedCushions,
  setSelectedCushions,
  displayMarkers,
  setDisplayMarkers,
  reverseMarkers,
  setReverseMarkers,
  pathWidth,
  setPathWidth,
  onClearObstacles,
  calculatePath,
  handleAddBlockBall,
  englishValue,
  setEnglishValue,
  spinValue,
  setSpinValue,
  strengthValue,
  setStrengthValue,
}) => {
  const [displayModal, setDisplayModal] = useState<boolean>(false);

  // 調整下塞方向
  const handleEnglishChange = useCallback(
    (value: EnglishType) => {
      setEnglishValue(value);
      if (!EnglishType.NONE) {
        setSpinValue(0);
        setStrengthValue(0);
      } else {
        setSpinValue(1);
      }
      calculatePath();
    },
    [calculatePath, setEnglishValue, setSpinValue, setStrengthValue]
  );

  // 調整旋轉值
  const handleSpinChange = useCallback(
    (value: number) => {
      setSpinValue(value);
      calculatePath();
    },
    [calculatePath, setSpinValue]
  );

  // 調整擊球力度
  const handleStrengtChange = useCallback(
    (value: number) => {
      setStrengthValue(value);
      calculatePath();
    },
    [calculatePath, setStrengthValue]
  );

  const handleCushionChange = (value: number) => {
    setSelectedCushions(value);
    calculatePath();
  };

  const handlePathWidthChange = (newWidth: number) => {
    setPathWidth(newWidth);
    calculatePath();
  };

  return (
    <div className="flex flex-col gap-8 mt-2">
      <Popup title="解球教學" display={displayModal} onClose={() => setDisplayModal(false)}>
        <section className="min-w-80 flex flex-col gap-y-4">
          <YouTubeEmbed url="https://www.youtube.com/watch?v=zksvrGiZyUM" width={560} height={315} />
          <InstagramEmbed
            url="https://www.instagram.com/p/C_SHWJxCJ_9/?api=Telegram%E7%BE%A4%E5%8F%91%E6%8F%90%E5%8D%87%E5%B7%A5%E5%85%B7%F0%9F%92%B0-[%E8%AE%A4%E5%87%86%E5%A4%A9%E5%AE%87TG%3A%40cjhshk199937]-TG%E8%87%AA%E5%8A%A8%E6%8B%89%E7%BE%A4%2FTG%E7%AD%9B%E9%80%89%E8%BD%AF%E4%BB%B6%2FTG%E5%BC%95%E6%B5%81%E7%A7%81%E4%BF%A1%E5%B7%A5%E5%85%B7.uqic"
            width={550}
          />
        </section>
      </Popup>

      {/* 第一行控制項 */}
      <div className="flex items-center justify-center gap-6">
        <Button
          onClick={() => setDisplayModal(true)}
          text="教學"
          className="text-sm px-2 py-1 ml-1 hidden md:flex"
          buttonStyle={ButtonStyleType.Active}
        />
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-background whitespace-nowrap">顆星次數:</span>
          <div className="flex flex-wrap justify-center items-center gap-1 md:gap-2">
            {[0, 1, 2, 3, 4, 5].map((num) => (
              <Button
                key={num}
                onClick={() => handleCushionChange(num)}
                buttonStyle={selectedCushions === num ? ButtonStyleType.Active : ButtonStyleType.Disabled}
                text={num.toString()}
                className="text-sm px-2 py-1 min-w-6 h-full"
              />
            ))}

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => handleAddBlockBall()}
                text="新增障礙球"
                className="text-sm px-2 py-1 ml-1 hidden md:flex"
                buttonStyle={ButtonStyleType.Active}
              />
              <Button
                onClick={onClearObstacles}
                text="清除障礙球"
                buttonStyle={ButtonStyleType.Warning}
                className="text-sm px-2 py-1 ml-1"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-1 md:gap-2">
          <Button
            onClick={() => handleEnglishChange(EnglishType.LEFT)}
            buttonStyle={englishValue === 1 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            text="左塞"
            className="text-sm px-2 py-1 min-w-6"
          />
          <Button
            onClick={() => handleEnglishChange(EnglishType.NONE)}
            buttonStyle={englishValue === 0 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            text="不下塞"
            className="text-sm px-2 py-1 min-w-6"
          />
          <Button
            onClick={() => handleEnglishChange(EnglishType.RIGHT)}
            buttonStyle={englishValue === -1 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            text="右塞"
            className="text-sm px-2 py-1 min-w-6"
          />
        </div>
      </div>

      {/* 第二行控制項 */}
      {englishValue !== EnglishType.NONE && (
        <div className="flex flex-wrap items-center justify-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-background whitespace-nowrap">旋轉值:</span>
            <div className="flex flex-col items-center">
              <div className="flex flex-wrap justify-center gap-1 md:gap-2">
                {[1, 2, 3].map((num) => (
                  <Button
                    key={`spin-${num}`}
                    onClick={() => handleSpinChange(num)}
                    buttonStyle={spinValue === num ? ButtonStyleType.Active : ButtonStyleType.Disabled}
                    text={num.toString()}
                    className="text-sm px-2 py-1 min-w-6"
                  />
                ))}
              </div>

              <Slider min={0.5} max={3} step={0.01} value={spinValue} onChange={handleSpinChange} style={{ width: 90 }} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-background whitespace-nowrap">擊球力度:</span>
            <div className="flex flex-col items-center">
              <div className="flex flex-wrap justify-center gap-1 md:gap-2">
                <Button
                  onClick={() => handleStrengtChange(-1)}
                  buttonStyle={strengthValue === -1 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
                  text="小力"
                  className="text-sm px-2 py-1 min-w-6"
                />
                <Button
                  onClick={() => handleStrengtChange(0)}
                  buttonStyle={strengthValue === 0 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
                  text="中等"
                  className="text-sm px-2 py-1 min-w-6"
                />
                <Button
                  onClick={() => handleStrengtChange(1)}
                  buttonStyle={strengthValue === 1 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
                  text="大力"
                  className="text-sm px-2 py-1 min-w-6"
                />
              </div>
              <Slider
                min={-2}
                max={1}
                step={0.01}
                value={strengthValue}
                onChange={handleStrengtChange}
                style={{ width: 160 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 第三行控制項 */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* 標記控制區塊 */}
        <div className="flex items-center justify-center gap-1">
          <span className="text-background whitespace-nowrap">顆星標記:</span>
          <Button
            onClick={() => {
              setDisplayMarkers(MarkerType.NONE);
              calculatePath();
            }}
            text="不顯示"
            buttonStyle={displayMarkers === MarkerType.NONE ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            className="text-sm px-2 py-1"
          />
          <Button
            onClick={() => {
              setDisplayMarkers(MarkerType.KO);
              calculatePath();
            }}
            text="柯式"
            buttonStyle={displayMarkers === MarkerType.KO ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            className="text-sm px-2 py-1"
          />
          <Button
            onClick={() => {
              setDisplayMarkers(MarkerType.OTHER);
              calculatePath();
            }}
            text="其他"
            buttonStyle={displayMarkers === MarkerType.OTHER ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            className="text-sm px-2 py-1"
          />
        </div>

        {/* 顛倒標記控制區塊 */}
        {displayMarkers !== MarkerType.NONE && (
          <div className="flex items-center justify-center gap-1">
            <span className="text-background whitespace-nowrap">顛倒:</span>
            <Button
              onClick={() => {
                setReverseMarkers(!reverseMarkers);
                calculatePath();
              }}
              disabled={!displayMarkers}
              text={!displayMarkers ? '隱藏' : reverseMarkers ? '顛倒' : '正常'}
              buttonStyle={
                !displayMarkers
                  ? ButtonStyleType.Warning
                  : !reverseMarkers
                    ? ButtonStyleType.Active
                    : ButtonStyleType.Disabled
              }
              className="text-sm px-2 py-1"
            />
          </div>
        )}

        {/* 路徑線寬度控制區塊 */}
        <div className="flex items-center justify-center gap-1">
          <span className="text-background whitespace-nowrap">瞄準線:</span>
          <Button
            onClick={() => (pathWidth < 20 ? handlePathWidthChange(pathWidth + 2) : alert('啊你是要多寬?'))}
            element={<>+</>}
            className="bg-link hover:scale-105 text-background px-2 py-1 md:px-4 md:py-2 rounded-lg text-center"
          />
          <Button
            onClick={() => (pathWidth > 2 ? handlePathWidthChange(pathWidth - 2) : alert('這麼細你瞄不到啦!'))}
            element={<>-</>}
            className="bg-link hover:scale-105 text-background px-2 py-1 md:px-3 md:py-1 rounded-lg text-center"
          />
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
