import React, { useEffect, useState } from 'react';

import { Vector2d } from 'konva/lib/types';

import { Button, ButtonStyleType } from '@/global-components/buttons/Button';

interface ControlPanelProps {
  selectedCushions: number;
  setSelectedCushions: (cushions: number) => void;
  displayMarkers: boolean;
  setDisplayMarkers: (display: boolean) => void;
  reverseMarkers: boolean;
  setReverseMarkers: (reverse: boolean) => void;
  pathWidth: number;
  setPathWidth: (width: number) => void;
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
}) => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // 檢測是否為手機版
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 初始檢查
    checkIsMobile();

    // 監聽視窗大小變化
    window.addEventListener('resize', checkIsMobile);

    // 清除監聽器
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleCushionChange = (value: number) => {
    setSelectedCushions(value);
    calculatePath();
  };

  const handlePathWidthChange = (newWidth: number) => {
    setPathWidth(newWidth);
    calculatePath();
  };

  return (
    <div className="flex flex-col gap-2 mt-2">
      {/* 第一行控制項 */}
      <div className="flex flex-wrap items-center justify-center p-2 gap-2">
        <span className={`text-background whitespace-nowrap ${isMobile ? 'text-sm' : ''}`}>顆星次數:</span>
        <div className={`flex flex-wrap justify-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
          {[0, 1, 2, 3, 4, 5].map((num) => (
            <Button
              key={num}
              onClick={() => handleCushionChange(num)}
              buttonStyle={selectedCushions === num ? ButtonStyleType.Active : ButtonStyleType.Disabled}
              text={num.toString()}
              className={isMobile ? 'text-sm px-2 py-1 min-w-6' : ''}
            />
          ))}
          {!isMobile && (
            <Button
              onClick={() => handleAddBlockBall()}
              text="新增障礙球"
              className="text-sm px-2 py-1 ml-1"
              buttonStyle={ButtonStyleType.Active}
            />
          )}
          <Button onClick={onClearObstacles} text="清除障礙球" className={isMobile ? 'text-sm px-2 py-1 ml-1' : 'ml-2'} />
        </div>
      </div>

      {/* 第二行控制項 */}
      <div className="flex flex-wrap items-center justify-center p-2 gap-2">
        {/* 標記控制區塊 */}
        <div className={`flex items-center justify-center p-1 gap-1 ${isMobile ? 'text-sm' : ''}`}>
          <span className="text-background whitespace-nowrap">兩顆星標記:</span>
          <Button
            onClick={() => {
              setDisplayMarkers(!displayMarkers);
              calculatePath();
            }}
            text={displayMarkers ? '隱藏' : '顯示'}
            buttonStyle={!displayMarkers ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            className={isMobile ? 'text-sm px-2 py-1' : ''}
          />
        </div>

        {/* 顛倒標記控制區塊 */}
        <div className={`flex items-center justify-center p-1 gap-1 ${isMobile ? 'text-sm' : ''}`}>
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
            className={isMobile ? 'text-sm px-2 py-1' : ''}
          />
        </div>

        {/* 路徑線寬度控制區塊 */}
        <div className={`flex items-center justify-center p-1 gap-1 ${isMobile ? 'text-sm' : ''}`}>
          <span className="text-background whitespace-nowrap">瞄準線:</span>
          <Button
            onClick={() => (pathWidth < 30 ? handlePathWidthChange(pathWidth + 2) : alert('啊你是要多寬?'))}
            element={<>+</>}
            className={`bg-link hover:scale-105 text-background ${isMobile ? 'px-2 py-1' : 'px-4 py-2'} rounded-lg text-center`}
          />
          <Button
            onClick={() => (pathWidth > 2 ? handlePathWidthChange(pathWidth - 2) : alert('這麼細你瞄不到啦!'))}
            element={<>-</>}
            className={`bg-link hover:scale-105 text-background ${isMobile ? 'px-2 py-1' : 'px-3 py-1'} rounded-lg text-center`}
          />
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
