import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button, ButtonStyleType } from '@/global-components/buttons/Button';
import Slider from '@/global-components/sliders/Slider';
import Tooltip from '@/global-components/tooltips/Tooltip';

import type { TextSizeProps } from '../Interface';

const BilliardAimCalculation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [positionRangeValue, setPositionRangeValue] = useState<number>(0.5);
  const [showLabel, setShowLabel] = useState<boolean>(true);
  const [showMark, setShowMark] = useState<boolean>(true);
  const [showDot, setShowDot] = useState<boolean>(true);
  const [textSize, setTextSize] = useState<TextSizeProps>({
    label: 12,
    angle: 10,
    mark: 16,
  });

  const labelFontStyle = `200 ${textSize.label}px 'Noto Sans TC'`;
  const angleFontStyle = `200 ${textSize.angle}px 'Noto Sans TC'`;
  const markFontStyle = `200 ${textSize.mark}px 'Noto Sans TC'`;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width - 135;
    const height = rect.height - 80;
    const r = Math.min(width, height) / 9 / 2;
    const paddingText = 10;

    const cueBallPos = {
      x: width / 2,
      y: height / 2 + 3 * 2 * r,
    };

    const targetBallPos = {
      x: width / 2,
      y: height / 2,
    };

    const shadowBallPos = {
      x: width / 2,
      y: targetBallPos.y + 2 * r,
    };

    const predictTargetBallPos = {
      x: width / 2,
      y: targetBallPos.y - 2 * 2 * r,
    };

    const angleDisplayPos = {
      x: shadowBallPos.x,
      y: shadowBallPos.y,
      text: 0,
    };

    const frontViewTargetBallPos = {
      x: width / 2 + 3 * 2 * r,
      y: height / 2,
    };

    const frontViewShadowBallPos = {
      x: width / 2 + 3 * 2 * r,
      y: height / 2,
    };

    const shandowBallY = Math.sqrt((2 * r) ** 2 - (positionRangeValue * 2 * r) ** 2);
    const sinAngle = shandowBallY / (2 * r);
    const cosAngle = (positionRangeValue * 2 * r) / (2 * r);

    shadowBallPos.x = cueBallPos.x = width / 2 + positionRangeValue * 2 * r;
    shadowBallPos.y = targetBallPos.y + shandowBallY;

    angleDisplayPos.x = shadowBallPos.x + r * cosAngle;
    angleDisplayPos.y = shadowBallPos.y + r * sinAngle;
    angleDisplayPos.text = ~~((Math.asin(cosAngle) * 180) / Math.PI);

    predictTargetBallPos.y = targetBallPos.y - 2 * 2 * r * sinAngle;
    predictTargetBallPos.x = targetBallPos.x - 2 * 2 * r * cosAngle;

    frontViewShadowBallPos.x = width / 2 + 3 * 2 * r + positionRangeValue * 2 * r;

    ctx.clearRect(0, 0, width, height);

    // 目標球
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.arc(targetBallPos.x, targetBallPos.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'green';
    ctx.stroke();
    ctx.font = labelFontStyle;
    ctx.fillStyle = 'black';
    showLabel && ctx.fillText('目標球', targetBallPos.x - r - paddingText - 15, targetBallPos.y);
    ctx.beginPath();
    ctx.arc(targetBallPos.x, targetBallPos.y, 2, 0, Math.PI * 2);
    ctx.fill();

    // 目標球目標點
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = 'blue';
    ctx.arc(predictTargetBallPos.x, predictTargetBallPos.y, r, 0, Math.PI * 2);
    ctx.font = labelFontStyle;
    ctx.fillStyle = 'black';
    ctx.stroke();
    showLabel && ctx.fillText('目標點', predictTargetBallPos.x - r - paddingText, predictTargetBallPos.y);
    ctx.beginPath();
    ctx.arc(predictTargetBallPos.x, predictTargetBallPos.y, 2, 0, Math.PI * 2);
    ctx.fill();

    // 母球
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.arc(cueBallPos.x, cueBallPos.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = labelFontStyle;
    ctx.fillStyle = 'black';
    showLabel && ctx.fillText('母球', cueBallPos.x - r - paddingText, cueBallPos.y);
    ctx.beginPath();
    ctx.arc(cueBallPos.x, cueBallPos.y, 2, 0, Math.PI * 2);
    ctx.fill();

    // 假想球
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.arc(shadowBallPos.x, shadowBallPos.y, r, 0, Math.PI * 2);
    ctx.setLineDash([2, 3]);
    ctx.stroke();
    ctx.font = labelFontStyle;
    ctx.fillStyle = 'black';
    showLabel && ctx.fillText('假想球', shadowBallPos.x - r - paddingText, shadowBallPos.y);
    ctx.beginPath();
    ctx.arc(shadowBallPos.x, shadowBallPos.y, 2, 0, Math.PI * 2);
    ctx.fill();

    // 兩球連線
    ctx.restore();
    ctx.save();
    // 母球 -> 假想球
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.moveTo(cueBallPos.x, cueBallPos.y);
    ctx.lineTo(shadowBallPos.x, targetBallPos.y);
    ctx.stroke();
    // 目標球 -> 假想球
    ctx.beginPath();
    ctx.strokeStyle = 'green';
    ctx.moveTo(targetBallPos.x, targetBallPos.y);
    ctx.lineTo(angleDisplayPos.x, angleDisplayPos.y);
    ctx.stroke();
    ctx.textAlign = 'left';
    // 角度
    ctx.font = angleFontStyle;
    ctx.fillStyle = 'black';
    ctx.fillText(`${angleDisplayPos.text}°`, angleDisplayPos.x + paddingText, angleDisplayPos.y);
    // A
    ctx.beginPath();
    ctx.arc(
      targetBallPos.x + (shadowBallPos.x - targetBallPos.x) / 2,
      targetBallPos.y + (shadowBallPos.y - targetBallPos.y) / 2,
      4,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = 'red';
    showDot && ctx.fill();
    ctx.font = markFontStyle;
    showMark &&
      ctx.fillText(
        'A',
        targetBallPos.x + (shadowBallPos.x - targetBallPos.x) / 2 + paddingText,
        targetBallPos.y + (shadowBallPos.y - targetBallPos.y) / 2
      );
    // B
    ctx.beginPath();
    ctx.arc(targetBallPos.x + r, targetBallPos.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'green';
    showDot && ctx.fill();
    showMark && ctx.fillText('B', targetBallPos.x + r + paddingText, targetBallPos.y);
    // C
    ctx.beginPath();
    ctx.arc(shadowBallPos.x - r, targetBallPos.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'blue';
    showDot && ctx.fill();
    showMark && ctx.fillText('C', shadowBallPos.x - r - paddingText, targetBallPos.y);

    // 目標球 -> 目標點
    ctx.beginPath();
    ctx.strokeStyle = 'blue';
    ctx.moveTo(targetBallPos.x, targetBallPos.y);
    ctx.lineTo(predictTargetBallPos.x, predictTargetBallPos.y);
    ctx.stroke();

    // 正視圖
    ctx.restore();
    ctx.save();
    // 目標球
    ctx.beginPath();
    ctx.strokeStyle = 'green';
    ctx.arc(frontViewTargetBallPos.x, frontViewTargetBallPos.y, r, 0, Math.PI * 2);
    ctx.stroke();
    // 假想球
    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.arc(frontViewShadowBallPos.x, frontViewShadowBallPos.y, r, 0, Math.PI * 2);
    ctx.setLineDash([2, 3]);
    ctx.stroke();
    // A
    ctx.beginPath();
    ctx.arc(
      frontViewTargetBallPos.x + (frontViewShadowBallPos.x - frontViewTargetBallPos.x) / 2,
      frontViewTargetBallPos.y + (frontViewShadowBallPos.y - frontViewTargetBallPos.y) / 2,
      4,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = 'red';
    showDot && ctx.fill();
    ctx.font = markFontStyle;
    showMark &&
      ctx.fillText(
        'A',
        frontViewTargetBallPos.x + (frontViewShadowBallPos.x - frontViewTargetBallPos.x) / 2 + paddingText,
        frontViewTargetBallPos.y + (frontViewShadowBallPos.y - frontViewTargetBallPos.y) / 2
      );
    // B
    ctx.beginPath();
    ctx.arc(frontViewTargetBallPos.x + r, frontViewTargetBallPos.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'green';
    showDot && ctx.fill();
    showMark && ctx.fillText('B', frontViewTargetBallPos.x + r + paddingText, frontViewTargetBallPos.y);
    // C
    ctx.beginPath();
    ctx.arc(frontViewShadowBallPos.x - r, frontViewShadowBallPos.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'blue';
    showDot && ctx.fill();
    showMark && ctx.fillText('C', frontViewShadowBallPos.x - r - paddingText, frontViewShadowBallPos.y);

    // 直線
    ctx.beginPath();
    ctx.moveTo(frontViewTargetBallPos.x, frontViewTargetBallPos.y - r - paddingText / 2);
    ctx.lineTo(frontViewTargetBallPos.x, frontViewTargetBallPos.y + r + paddingText / 2);
    ctx.strokeStyle = 'green';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(frontViewShadowBallPos.x, frontViewTargetBallPos.y - r - paddingText / 2);
    ctx.lineTo(frontViewShadowBallPos.x, frontViewTargetBallPos.y + r + paddingText / 2);
    ctx.strokeStyle = 'black';
    ctx.stroke();

    // 文字
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('上帝視角', targetBallPos.x, cueBallPos.y - 12 * r);
    ctx.fillText('瞄球視角', frontViewTargetBallPos.x, cueBallPos.y - 12 * r);
  }, [angleFontStyle, labelFontStyle, markFontStyle, positionRangeValue, showDot, showLabel, showMark]);

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

  // Initialize canvas once on mount
  useEffect(() => {
    const init = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio;
      const width = Math.min(window.innerWidth * 0.95, 600); // Max width of 600px for larger screens
      const height = (width * 3) / 4; // Maintain aspect ratio of 4:3

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      render();
    };

    init();

    window.addEventListener('resize', init);
    return () => window.removeEventListener('resize', init);
  }, [render]);

  // Separate effect to handle rendering when dependencies change
  useEffect(() => {
    render();
  }, [render]);

  // Handler for slider value changes
  const handlePositionChange = useCallback((value: number) => {
    setPositionRangeValue(value);
  }, []);

  return (
    <section className="bg-foreground p-4 rounded-2xl flex flex-col items-center gap-y-2">
      <canvas ref={canvasRef} className="border-4 border-background rounded-2xl" />
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
          className="bg-link hover:scale-105 text-background px-3 py-1 rounded-lg text-center"
        />
        <input type="checkbox" checked={showLabel} onChange={() => setShowLabel(!showLabel)} />
        <span className="text-background">文字</span>
        <input type="checkbox" checked={showMark} onChange={() => setShowMark(!showMark)} />
        <span className="text-background">記號</span>
        <input type="checkbox" checked={showDot} onChange={() => setShowDot(!showDot)} />
        <span className="text-background">圓點</span>
      </div>

      {/* Angle */}
      <>
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
      </>
    </section>
  );
};

export default BilliardAimCalculation;
