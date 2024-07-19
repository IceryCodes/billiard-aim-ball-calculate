import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./components/Button";
import { SliderBar } from "./components/SliderBar";

const BilliardAimCalculation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [positionRangeValue, setPositionRangeValue] = useState<number>(0.5); // Use state for slider value

  const [showLabel, setShowLabel] = useState<boolean>(true);

  const labelFontStyle = "14px sans-serif";
  const angleFontStyle = "12px sans-serif";

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = window.innerWidth * 0.8;
    const height = window.innerHeight * 0.8;
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

    const shandowBallY = Math.sqrt(
      (2 * r) ** 2 - (positionRangeValue * 2 * r) ** 2
    );
    const sinAngle = shandowBallY / (2 * r);
    const cosAngle = (positionRangeValue * 2 * r) / (2 * r);

    shadowBallPos.x = cueBallPos.x = width / 2 + positionRangeValue * 2 * r;
    shadowBallPos.y = targetBallPos.y + shandowBallY;

    angleDisplayPos.x = shadowBallPos.x + r * cosAngle;
    angleDisplayPos.y = shadowBallPos.y + r * sinAngle;
    angleDisplayPos.text = ~~((Math.asin(cosAngle) * 180) / Math.PI);

    predictTargetBallPos.y = targetBallPos.y - 2 * 2 * r * sinAngle;
    predictTargetBallPos.x = targetBallPos.x - 2 * 2 * r * cosAngle;

    frontViewShadowBallPos.x =
      width / 2 + 3 * 2 * r + positionRangeValue * 2 * r;

    ctx.clearRect(0, 0, width, height);

    // Render all elements...

    // 子球
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "#000";
    ctx.arc(targetBallPos.x, targetBallPos.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = "green";
    ctx.stroke();
    ctx.font = labelFontStyle;
    showLabel &&
      ctx.fillText("子球", targetBallPos.x - r - paddingText, targetBallPos.y);
    ctx.beginPath();
    ctx.arc(targetBallPos.x, targetBallPos.y, 2, 0, Math.PI * 2);
    ctx.fill();

    // 子球目標點
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "blue";
    ctx.arc(predictTargetBallPos.x, predictTargetBallPos.y, r, 0, Math.PI * 2);
    ctx.font = labelFontStyle;
    ctx.stroke();
    showLabel &&
      ctx.fillText(
        "目標點",
        predictTargetBallPos.x - r - paddingText,
        predictTargetBallPos.y
      );
    ctx.beginPath();
    ctx.arc(predictTargetBallPos.x, predictTargetBallPos.y, 2, 0, Math.PI * 2);
    ctx.fill();

    // 母球
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "#000";
    ctx.arc(cueBallPos.x, cueBallPos.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = labelFontStyle;
    showLabel &&
      ctx.fillText("母球", cueBallPos.x - r - paddingText, cueBallPos.y);
    ctx.beginPath();
    ctx.arc(cueBallPos.x, cueBallPos.y, 2, 0, Math.PI * 2);
    ctx.fill();

    // 假想球
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "#000";
    ctx.arc(shadowBallPos.x, shadowBallPos.y, r, 0, Math.PI * 2);
    ctx.setLineDash([2, 3]);
    ctx.stroke();
    ctx.font = labelFontStyle;
    showLabel &&
      ctx.fillText(
        "假想球",
        shadowBallPos.x - r - paddingText,
        shadowBallPos.y
      );
    ctx.beginPath();
    ctx.arc(shadowBallPos.x, shadowBallPos.y, 2, 0, Math.PI * 2);
    ctx.fill();

    // 兩球連線
    ctx.restore();
    ctx.save();
    // 母球 -> 假想球
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.moveTo(cueBallPos.x, cueBallPos.y);
    ctx.lineTo(shadowBallPos.x, targetBallPos.y);
    ctx.stroke();
    // 子球 -> 假想球
    ctx.beginPath();
    ctx.strokeStyle = "green";
    ctx.moveTo(targetBallPos.x, targetBallPos.y);
    ctx.lineTo(angleDisplayPos.x, angleDisplayPos.y);
    ctx.stroke();
    ctx.textAlign = "left";
    // 角度
    ctx.font = angleFontStyle;
    ctx.fillText(
      `${angleDisplayPos.text}°`,
      angleDisplayPos.x + paddingText,
      angleDisplayPos.y
    );
    // A
    ctx.beginPath();
    ctx.arc(
      targetBallPos.x + (shadowBallPos.x - targetBallPos.x) / 2,
      targetBallPos.y + (shadowBallPos.y - targetBallPos.y) / 2,
      4,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.font = "18px sans-serif";
    ctx.fillText(
      "A",
      targetBallPos.x + (shadowBallPos.x - targetBallPos.x) / 2 + paddingText,
      targetBallPos.y + (shadowBallPos.y - targetBallPos.y) / 2
    );
    // B
    ctx.beginPath();
    ctx.arc(targetBallPos.x + r, targetBallPos.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "green";
    ctx.fill();
    ctx.fillText("B", targetBallPos.x + r + paddingText, targetBallPos.y);
    // C
    ctx.beginPath();
    ctx.arc(shadowBallPos.x - r, targetBallPos.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "blue";
    ctx.fill();
    ctx.fillText("C", shadowBallPos.x - r - paddingText, targetBallPos.y);

    // 子球 -> 目標點
    ctx.beginPath();
    ctx.strokeStyle = "blue";
    ctx.moveTo(targetBallPos.x, targetBallPos.y);
    ctx.lineTo(predictTargetBallPos.x, predictTargetBallPos.y);
    ctx.stroke();

    // 正視圖
    ctx.restore();
    ctx.save();
    // 子球
    ctx.beginPath();
    ctx.strokeStyle = "green";
    ctx.arc(
      frontViewTargetBallPos.x,
      frontViewTargetBallPos.y,
      r,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    // 假想球
    ctx.beginPath();
    ctx.strokeStyle = "#000";
    ctx.arc(
      frontViewShadowBallPos.x,
      frontViewShadowBallPos.y,
      r,
      0,
      Math.PI * 2
    );
    ctx.setLineDash([2, 3]);
    ctx.stroke();
    // A
    ctx.beginPath();
    ctx.arc(
      frontViewTargetBallPos.x +
        (frontViewShadowBallPos.x - frontViewTargetBallPos.x) / 2,
      frontViewTargetBallPos.y +
        (frontViewShadowBallPos.y - frontViewTargetBallPos.y) / 2,
      4,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.font = "18px sans-serif";
    ctx.fillText(
      "A",
      frontViewTargetBallPos.x +
        (frontViewShadowBallPos.x - frontViewTargetBallPos.x) / 2 +
        paddingText,
      frontViewTargetBallPos.y +
        (frontViewShadowBallPos.y - frontViewTargetBallPos.y) / 2
    );
    // B
    ctx.beginPath();
    ctx.arc(
      frontViewTargetBallPos.x + r,
      frontViewTargetBallPos.y,
      4,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = "green";
    ctx.fill();
    ctx.fillText(
      "B",
      frontViewTargetBallPos.x + r + paddingText,
      frontViewTargetBallPos.y
    );
    // C
    ctx.beginPath();
    ctx.arc(
      frontViewShadowBallPos.x - r,
      frontViewShadowBallPos.y,
      4,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = "blue";
    ctx.fill();
    ctx.fillText(
      "C",
      frontViewShadowBallPos.x - r - paddingText,
      frontViewShadowBallPos.y
    );

    // 直線
    ctx.beginPath();
    ctx.moveTo(
      frontViewTargetBallPos.x,
      frontViewTargetBallPos.y - r - paddingText / 2
    );
    ctx.lineTo(
      frontViewTargetBallPos.x,
      frontViewTargetBallPos.y + r + paddingText / 2
    );
    ctx.strokeStyle = "green";
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(
      frontViewShadowBallPos.x,
      frontViewTargetBallPos.y - r - paddingText / 2
    );
    ctx.lineTo(
      frontViewShadowBallPos.x,
      frontViewTargetBallPos.y + r + paddingText / 2
    );
    ctx.strokeStyle = "black";
    ctx.stroke();

    // 文字
    ctx.fillStyle = "black";
    ctx.fill();
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      "瞄球視角",
      frontViewTargetBallPos.x +
        (frontViewShadowBallPos.x - frontViewTargetBallPos.x) / 2,
      frontViewTargetBallPos.y + 2 * r
    );
    ctx.fillText("上帝視角", targetBallPos.x, cueBallPos.y + 2 * r);
  }, [positionRangeValue, showLabel]);

  useEffect(() => {
    const init = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio;
      const width = window.innerWidth * 0.8;
      const height = window.innerHeight * 0.8;

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      render();
    };

    init();
  }, [render]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
          gap: 5,
        }}
      >
        <span className="unselectable">瞄準角度</span>
        <SliderBar
          min={0}
          max={1}
          step={0.01}
          defaultValue={0.5}
          style={{ width: 215 }}
          value={positionRangeValue}
          onChange={setPositionRangeValue}
        />
        <div
          style={{
            display: "flex",
            gap: 5,
            flexDirection: "row",
          }}
        >
          <Button value={0} angle="0°" setAngle={setPositionRangeValue} />
          <Button value={0.5} angle="30°" setAngle={setPositionRangeValue} />
          <Button value={0.71} angle="45°" setAngle={setPositionRangeValue} />
          <Button value={0.87} angle="60°" setAngle={setPositionRangeValue} />
          <Button value={1} angle="90°" setAngle={setPositionRangeValue} />
        </div>
        <button
          type="button"
          onClick={() => setShowLabel(!showLabel)}
          style={{ width: 80 }}
        >
          {showLabel ? "隱藏文字" : "顯示文字"}
        </button>

        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default BilliardAimCalculation;
