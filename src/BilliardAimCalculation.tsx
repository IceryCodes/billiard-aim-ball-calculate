import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import { Button } from "./components/Button";

const BilliardAimCalculation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const positionRangeRef = useRef<HTMLInputElement | null>(null);

  const setPositionRange = useCallback((value: number) => {
    if (positionRangeRef.current) {
      positionRangeRef.current.value = value.toString();
      positionRangeRef.current.dispatchEvent(
        new Event("input", { bubbles: true })
      );
    }
  }, []);

  useEffect(() => {
    const init = () => {
      const canvas = canvasRef.current;
      const positionRange = positionRangeRef.current;

      if (!canvas || !positionRange) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio;
      console.log("dpr", window.innerWidth);
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

      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      ctx.font = "14px sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.lineWidth = 2;

      const rangeInput = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const shandowBallY = Math.sqrt(
          (2 * r) ** 2 - (Number.parseFloat(target.value) * 2 * r) ** 2
        );
        const sinAngle = shandowBallY / (2 * r);
        const cosAngle = (Number.parseFloat(target.value) * 2 * r) / (2 * r);

        shadowBallPos.x = cueBallPos.x =
          width / 2 + Number.parseFloat(target.value) * 2 * r;
        shadowBallPos.y = targetBallPos.y + shandowBallY;

        angleDisplayPos.x = shadowBallPos.x + r * cosAngle;
        angleDisplayPos.y = shadowBallPos.y + r * sinAngle;
        angleDisplayPos.text = ~~((Math.asin(cosAngle) * 180) / Math.PI);

        predictTargetBallPos.y = targetBallPos.y - 2 * 2 * r * sinAngle;
        predictTargetBallPos.x = targetBallPos.x - 2 * 2 * r * cosAngle;

        frontViewShadowBallPos.x =
          width / 2 + 3 * 2 * r + Number.parseFloat(target.value) * 2 * r;

        render();
      };

      const render = () => {
        ctx.clearRect(0, 0, width, height);

        // 子球
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = "#000";
        ctx.arc(targetBallPos.x, targetBallPos.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = "green";
        ctx.stroke();
        ctx.fillText(
          "子球",
          targetBallPos.x - r - paddingText,
          targetBallPos.y
        );
        ctx.beginPath();
        ctx.arc(targetBallPos.x, targetBallPos.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // 子球目標點
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = "blue";
        ctx.arc(
          predictTargetBallPos.x,
          predictTargetBallPos.y,
          r,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.fillText(
          "目標點",
          predictTargetBallPos.x - r - paddingText,
          predictTargetBallPos.y
        );
        ctx.beginPath();
        ctx.arc(
          predictTargetBallPos.x,
          predictTargetBallPos.y,
          2,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // 母球
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = "#000";
        ctx.arc(cueBallPos.x, cueBallPos.y, r, 0, Math.PI * 2);
        ctx.stroke();
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
          targetBallPos.x +
            (shadowBallPos.x - targetBallPos.x) / 2 +
            paddingText,
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
        ctx.textAlign = "right";
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
        // 點
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
        ctx.textAlign = "center";
        ctx.fillText(
          "A",
          frontViewTargetBallPos.x +
            (frontViewShadowBallPos.x - frontViewTargetBallPos.x) / 2,
          frontViewTargetBallPos.y +
            (frontViewShadowBallPos.y - frontViewTargetBallPos.y) / 2 +
            paddingText
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
      };

      positionRange.addEventListener("input", rangeInput);
      render();
    };

    init();
    setPositionRange(0.5);
  }, [setPositionRange]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <span>角度</span>
        <input
          ref={positionRangeRef}
          type="range"
          name="positionRange"
          min="-1"
          max="1"
          step="0.01"
          style={{ width: 270 }}
        />
        <div
          style={{
            display: "flex",
            gap: 5,
            flexDirection: "row",
          }}
        >
          <Button value={-1} angle="-90°" setAngle={setPositionRange} />
          <Button value={-0.71} angle="-45°" setAngle={setPositionRange} />
          <Button value={-0.5} angle="-30°" setAngle={setPositionRange} />
          <Button value={0} angle="0°" setAngle={setPositionRange} />
          <Button value={0.5} angle="30°" setAngle={setPositionRange} />
          <Button value={0.71} angle="45°" setAngle={setPositionRange} />
          <Button value={1} angle="90°" setAngle={setPositionRange} />
        </div>

        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default BilliardAimCalculation;
