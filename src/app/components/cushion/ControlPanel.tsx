import React, { useCallback } from 'react';

import { Vector2d } from 'konva/lib/types';

import { Button, ButtonStyleType } from '@/global-components/buttons/Button';
import Slider from '@/global-components/sliders/Slider';

interface ControlPanelProps {
  selectedCushions: number;
  setSelectedCushions: (cushions: number) => void;
  displayMarkers: boolean;
  setDisplayMarkers: (display: boolean) => void;
  reverseMarkers: boolean;
  setReverseMarkers: (reverse: boolean) => void;
  pathWidth: number;
  setPathWidth: (width: number) => void;
  englishValue: number;
  setEnglishValue: (value: number) => void;
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
  // 調整下塞方向
  const handleEnglishChange = useCallback(
    (value: number) => {
      setEnglishValue(value);
      if (!value) {
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
      {/* 第一行控制項 */}
      <div className="flex items-center justify-center gap-8">
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
            onClick={() => handleEnglishChange(1)}
            buttonStyle={englishValue === 1 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            text="左塞"
            className="text-sm px-2 py-1 min-w-6"
          />
          <Button
            onClick={() => handleEnglishChange(0)}
            buttonStyle={englishValue === 0 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            text="不下塞"
            className="text-sm px-2 py-1 min-w-6"
          />
          <Button
            onClick={() => handleEnglishChange(-1)}
            buttonStyle={englishValue === -1 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            text="右塞"
            className="text-sm px-2 py-1 min-w-6"
          />
        </div>
      </div>

      {/* 第二行控制項 */}
      <div className="flex flex-wrap items-center justify-center gap-8">
        <div className="flex items-center gap-2">
          <span className="text-background whitespace-nowrap">旋轉值:</span>
          <div className="flex flex-col items-center">
            <div className="flex flex-wrap justify-center gap-1 md:gap-2">
              {[1, 2, 3].map((num) => (
                <Button
                  key={`spin-${num}`}
                  onClick={() => handleSpinChange(num)}
                  buttonStyle={spinValue === num && englishValue !== 0 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
                  text={num.toString()}
                  className="text-sm px-2 py-1 min-w-6"
                  disabled={englishValue === 0}
                />
              ))}
            </div>

            <Slider
              min={0.5}
              max={3}
              step={0.01}
              value={spinValue}
              onChange={handleSpinChange}
              style={{ width: 90 }}
              disabled={englishValue === 0}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-background whitespace-nowrap">擊球力度:</span>
          <div className="flex flex-col items-center">
            <div className="flex flex-wrap justify-center gap-1 md:gap-2">
              <Button
                onClick={() => handleStrengtChange(-1)}
                buttonStyle={strengthValue === -1 && englishValue !== 0 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
                text="小力"
                className="text-sm px-2 py-1 min-w-6"
                disabled={englishValue === 0}
              />
              <Button
                onClick={() => handleStrengtChange(0)}
                buttonStyle={strengthValue === 0 && englishValue !== 0 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
                text="中等"
                className="text-sm px-2 py-1 min-w-6"
                disabled={englishValue === 0}
              />
              <Button
                onClick={() => handleStrengtChange(1)}
                buttonStyle={strengthValue === 1 && englishValue !== 0 ? ButtonStyleType.Active : ButtonStyleType.Disabled}
                text="大力"
                className="text-sm px-2 py-1 min-w-6"
                disabled={englishValue === 0}
              />
            </div>
            <Slider
              min={-2}
              max={1}
              step={0.01}
              value={strengthValue}
              onChange={handleStrengtChange}
              style={{ width: 160 }}
              disabled={englishValue === 0}
            />
          </div>
        </div>
      </div>

      {/* 第三行控制項 */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* 標記控制區塊 */}
        <div className="flex items-center justify-center gap-1">
          <span className="text-background whitespace-nowrap">兩顆星標記:</span>
          <Button
            onClick={() => {
              setDisplayMarkers(!displayMarkers);
              calculatePath();
            }}
            text={displayMarkers ? '隱藏' : '顯示'}
            buttonStyle={!displayMarkers ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            className="text-sm px-2 py-1"
          />
        </div>

        {/* 顛倒標記控制區塊 */}
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
              !displayMarkers ? ButtonStyleType.Warning : !reverseMarkers ? ButtonStyleType.Active : ButtonStyleType.Disabled
            }
            className="text-sm px-2 py-1"
          />
        </div>

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
