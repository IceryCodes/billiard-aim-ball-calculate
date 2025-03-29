import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, ButtonStyleType } from '@/global-components/buttons/Button';

// Types and interfaces
interface Ball {
  id: string;
  x: number;
  y: number;
  TABLE_RADIUS: number;
  color: string;
  isDragging: boolean;
}

interface TableDimensions {
  width: number;
  height: number;
  cushionWidth: number;
  pocketRadius: number;
  innerPadding: number;
}

interface PathPoint {
  x: number;
  y: number;
}

interface BilliardCushionCalculationProps {
  width?: number;
  height?: number;
  onPathCalculated?: (path: PathPoint[]) => void;
  className?: string;
}

interface MouseMoveHandler {
  (event: React.MouseEvent<HTMLCanvasElement>): void;
  timeoutId: number | null;
}

// 新增的標記介面
interface TableMarker {
  position: 'top' | 'bottom' | 'right' | 'rightReverse';
  value: string;
  offset: number; // 相對於邊緣的偏移比例 (0-1)
}

const BilliardCushionCalculation: React.FC<BilliardCushionCalculationProps> = ({
  width = 800,
  height = 400,
  onPathCalculated,
  className,
}) => {
  // Constants
  const tableDimensions = useMemo(
    (): TableDimensions => ({
      width: width - 60, // Accounting for cushion
      height: height - 60, // Accounting for cushion
      cushionWidth: 30,
      pocketRadius: 28,
      innerPadding: 10, // 內邊距（淺藍色區域邊距）
    }),
    [height, width]
  );

  const BALL_RADIUS = 15;
  const GHOST_BALL_STROKE_WIDTH = 2;
  const TABLE_RADIUS = 20;

  // 定義桌邊標記
  const tableMarkers = useMemo(
    (): TableMarker[] => [
      // 頂部標記
      { position: 'top', value: '0', offset: 0 },
      { position: 'top', value: '1', offset: 0.125 },
      { position: 'top', value: '2', offset: 0.25 },
      { position: 'top', value: '3', offset: 0.375 },
      { position: 'top', value: '4', offset: 0.5 },
      { position: 'top', value: '5', offset: 0.625 },
      { position: 'top', value: '6', offset: 0.75 },
      { position: 'top', value: '7', offset: 0.875 },
      { position: 'top', value: '8', offset: 1 },

      // 底部標記
      { position: 'bottom', value: '1', offset: 0 },
      { position: 'bottom', value: '1.5', offset: 0.125 },
      { position: 'bottom', value: '2', offset: 0.25 },
      { position: 'bottom', value: '2.5', offset: 0.375 },
      { position: 'bottom', value: '3', offset: 0.5 },
      { position: 'bottom', value: '3.5', offset: 0.625 },
      { position: 'bottom', value: '4', offset: 0.75 },
      { position: 'bottom', value: '4.5', offset: 0.875 },
      { position: 'bottom', value: '5', offset: 1 },

      // 右邊標記
      { position: 'right', value: '8', offset: 0.255 },
      { position: 'right', value: '7', offset: 0.505 },
      { position: 'right', value: '6', offset: 0.755 },

      // 顛倒右邊標記
      { position: 'rightReverse', value: '6', offset: 0.255 },
      { position: 'rightReverse', value: '7', offset: 0.505 },
      { position: 'rightReverse', value: '8', offset: 0.755 },
    ],
    []
  );

  // State declarations
  const [selectedCushions, setSelectedCushions] = useState<number>(0);
  const [balls, setBalls] = useState<Ball[]>([
    { id: 'cueBall', x: width / 4, y: height / 2, TABLE_RADIUS: BALL_RADIUS, color: 'white', isDragging: false },
    { id: 'ghostBall', x: width / 3, y: height / 2, TABLE_RADIUS: BALL_RADIUS, color: 'transparent', isDragging: false },
    { id: 'targetBall', x: (width * 3) / 4, y: height / 2, TABLE_RADIUS: BALL_RADIUS, color: 'red', isDragging: false },
  ]);
  const [obstacleBalls, setObstacleBalls] = useState<Ball[]>([]);
  const [calculatedPath, setCalculatedPath] = useState<PathPoint[]>([]);
  const [nextObstacleId, setNextObstacleId] = useState<number>(1);
  const [pathWidth, setPathWidth] = useState<number>(4);
  const [displayMarkers, setDisplayMarkers] = useState<boolean>(false);
  const [reverseMarkers, setReverseMarkers] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutIdRef = useRef<number | null>(null);

  // Get ball positions from state
  const getCueBall = useCallback(() => {
    const ball = balls.find((ball) => ball.id === 'cueBall');
    if (!ball) {
      throw new Error('Cue ball not found');
    }
    return ball;
  }, [balls]);

  const getGhostBall = useCallback(() => {
    const ball = balls.find((ball) => ball.id === 'ghostBall');
    if (!ball) {
      throw new Error('Ghost ball not found');
    }
    return ball;
  }, [balls]);

  const getTargetBall = useCallback(() => {
    const ball = balls.find((ball) => ball.id === 'targetBall');
    if (!ball) {
      throw new Error('Target ball not found');
    }
    return ball;
  }, [balls]);

  // Check for collision between a line and a ball
  const lineIntersectsBall = useCallback((x1: number, y1: number, x2: number, y2: number, ball: Ball): boolean => {
    // Vector from line point 1 to ball center
    const v1x = ball.x - x1;
    const v1y = ball.y - y1;

    // Vector from line point 1 to line point 2
    const v2x = x2 - x1;
    const v2y = y2 - y1;

    // Length of the line segment
    const lineLength = Math.sqrt(v2x * v2x + v2y * v2y);

    // Normalized line vector
    const v2xNorm = v2x / lineLength;
    const v2yNorm = v2y / lineLength;

    // Project ball center vector onto the line vector
    const projection = v1x * v2xNorm + v1y * v2yNorm;

    // Clamp projection to the line segment
    const clampedProjection = Math.max(0, Math.min(lineLength, projection));

    // Get the closest point on the line to the ball center
    const closestX = x1 + clampedProjection * v2xNorm;
    const closestY = y1 + clampedProjection * v2yNorm;

    // Calculate distance from closest point to ball center
    const distance = Math.sqrt((ball.x - closestX) ** 2 + (ball.y - closestY) ** 2);

    // Check if the distance is less than or equal to the ball TABLE_RADIUS
    return distance <= ball.TABLE_RADIUS;
  }, []);

  // Ball drag handlers
  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Check if we're clicking on an existing ball
      const allBalls = [...balls, ...obstacleBalls];
      for (const ball of allBalls) {
        const distance = Math.sqrt((ball.x - x) ** 2 + (ball.y - y) ** 2);
        if (distance <= ball.TABLE_RADIUS) {
          if (balls.some((b) => b.id === ball.id)) {
            setBalls((prevBalls) => prevBalls.map((b) => (b.id === ball.id ? { ...b, isDragging: true } : b)));
          } else {
            setObstacleBalls((prevBalls) => prevBalls.map((b) => (b.id === ball.id ? { ...b, isDragging: true } : b)));
          }
          return;
        }
      }

      // If clicking on empty space and right mouse button, add an obstacle ball
      if (event.button === 2) {
        // 確保新障礙球位於淺藍色區域內
        const constrainedX = Math.max(
          tableDimensions.cushionWidth + tableDimensions.innerPadding + BALL_RADIUS,
          Math.min(width - tableDimensions.cushionWidth - tableDimensions.innerPadding - BALL_RADIUS, x)
        );
        const constrainedY = Math.max(
          tableDimensions.cushionWidth + tableDimensions.innerPadding + BALL_RADIUS,
          Math.min(height - tableDimensions.cushionWidth - tableDimensions.innerPadding - BALL_RADIUS, y)
        );

        const newObstacleBall: Ball = {
          id: `obstacle${nextObstacleId}`,
          x: constrainedX,
          y: constrainedY,
          TABLE_RADIUS: BALL_RADIUS,
          color: '#101010',
          isDragging: true,
        };
        setObstacleBalls((prev) => [...prev, newObstacleBall]);
        setNextObstacleId((prevId) => prevId + 1);
      }
    },
    [balls, obstacleBalls, nextObstacleId, tableDimensions, width, height, BALL_RADIUS]
  );

  // Check for collision between a line and any obstacle ball
  const checkPathObstruction = useCallback(
    (x1: number, y1: number, x2: number, y2: number): Ball | null => {
      // Don't check collision with ghost ball
      const obstaclesToCheck = [...obstacleBalls, getTargetBall()].filter((ball) => ball.id !== 'ghostBall');

      for (const ball of obstaclesToCheck) {
        if (lineIntersectsBall(x1, y1, x2, y2, ball)) {
          return ball;
        }
      }
      return null;
    },
    [obstacleBalls, getTargetBall, lineIntersectsBall]
  );

  // 修正後的庫邊碰撞檢測，添加更精確的位置計算
  const findCushionIntersection = useCallback(
    (
      posX: number,
      posY: number,
      velocX: number,
      velocY: number,
      tableBounds: { left: number; right: number; top: number; bottom: number }
    ) => {
      // 使用較小的浮點數容差值
      const EPSILON = 1e-10;

      let tMin = Infinity;
      let hitPoint = { x: 0, y: 0 };
      let hitNormal = { x: 0, y: 0 };

      // 檢查左側庫邊
      if (Math.abs(velocX) > EPSILON && velocX < 0) {
        const t = (tableBounds.left - posX) / velocX;
        if (t >= 0 && t < tMin) {
          const yIntersect = posY + velocY * t;
          // 添加容差範圍檢查，確保點在庫邊上
          if (yIntersect >= tableBounds.top - EPSILON && yIntersect <= tableBounds.bottom + EPSILON) {
            tMin = t;
            // 使用精確小數計算碰撞點
            hitPoint = {
              x: tableBounds.left,
              y: Math.max(tableBounds.top, Math.min(tableBounds.bottom, yIntersect)),
            };
            hitNormal = { x: 1, y: 0 }; // 法向量指向右側
          }
        }
      }

      // 右側庫邊
      if (Math.abs(velocX) > EPSILON && velocX > 0) {
        const t = (tableBounds.right - posX) / velocX;
        if (t >= 0 && t < tMin) {
          const yIntersect = posY + velocY * t;
          if (yIntersect >= tableBounds.top - EPSILON && yIntersect <= tableBounds.bottom + EPSILON) {
            tMin = t;
            hitPoint = {
              x: tableBounds.right,
              y: Math.max(tableBounds.top, Math.min(tableBounds.bottom, yIntersect)),
            };
            hitNormal = { x: -1, y: 0 };
          }
        }
      }

      // 上側庫邊
      if (Math.abs(velocY) > EPSILON && velocY < 0) {
        const t = (tableBounds.top - posY) / velocY;
        if (t >= 0 && t < tMin) {
          const xIntersect = posX + velocX * t;
          if (xIntersect >= tableBounds.left - EPSILON && xIntersect <= tableBounds.right + EPSILON) {
            tMin = t;
            hitPoint = {
              x: Math.max(tableBounds.left, Math.min(tableBounds.right, xIntersect)),
              y: tableBounds.top,
            };
            hitNormal = { x: 0, y: 1 };
          }
        }
      }

      // 下側庫邊
      if (Math.abs(velocY) > EPSILON && velocY > 0) {
        const t = (tableBounds.bottom - posY) / velocY;
        if (t >= 0 && t < tMin) {
          const xIntersect = posX + velocX * t;
          if (xIntersect >= tableBounds.left - EPSILON && xIntersect <= tableBounds.right + EPSILON) {
            tMin = t;
            hitPoint = {
              x: Math.max(tableBounds.left, Math.min(tableBounds.right, xIntersect)),
              y: tableBounds.bottom,
            };
            hitNormal = { x: 0, y: -1 };
          }
        }
      }

      if (tMin < Infinity) {
        return { hitPoint, hitNormal, tMin };
      }

      return null; // 沒有碰撞
    },
    []
  );

  // Calculate the ball path with cushions
  const calculatePath = useCallback(() => {
    const cueBall = getCueBall();
    const ghostBall = getGhostBall();
    const targetBall = getTargetBall();

    if (!cueBall || !ghostBall || !targetBall) return;

    const path: PathPoint[] = [];
    const currentPoint = { x: cueBall.x, y: cueBall.y };
    path.push(currentPoint);

    // 從母球到幻影球的方向
    const dirX = ghostBall.x - cueBall.x;
    const dirY = ghostBall.y - cueBall.y;
    const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);

    // 檢查母球和幻影球之間是否有障礙
    const obstacleBetweenCueAndGhost = checkPathObstruction(cueBall.x, cueBall.y, ghostBall.x, ghostBall.y);
    if (obstacleBetweenCueAndGhost) {
      // 計算與障礙物的交點
      const dx = ghostBall.x - cueBall.x;
      const dy = ghostBall.y - cueBall.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const unitX = dx / length;
      const unitY = dy / length;

      // 獲取從母球到障礙邊緣的距離
      const distanceToBall =
        Math.sqrt((obstacleBetweenCueAndGhost.x - cueBall.x) ** 2 + (obstacleBetweenCueAndGhost.y - cueBall.y) ** 2) -
        obstacleBetweenCueAndGhost.TABLE_RADIUS;

      // 將交點添加到路徑
      const intersectionX = cueBall.x + unitX * distanceToBall;
      const intersectionY = cueBall.y + unitY * distanceToBall;
      path.push({ x: intersectionX, y: intersectionY });

      setCalculatedPath(path);
      if (onPathCalculated) onPathCalculated(path);
      return;
    }

    // 將幻影球添加到路徑
    path.push({ x: ghostBall.x, y: ghostBall.y });

    // 標準化方向向量
    const unitDirX = dirX / dirLength;
    const unitDirY = dirY / dirLength;

    // 庫邊計算的起始位置（從幻影球開始）
    let posX = ghostBall.x;
    let posY = ghostBall.y;
    let velocX = unitDirX;
    let velocY = unitDirY;

    // 零庫情況，檢查是否直接打到目標球
    if (selectedCushions === 0) {
      // 從幻影球沿行進方向延伸
      const extendedX = ghostBall.x + unitDirX * 1000; // 任意大的距離
      const extendedY = ghostBall.y + unitDirY * 1000;

      // 檢查是否有障礙物
      const obstacle = checkPathObstruction(ghostBall.x, ghostBall.y, extendedX, extendedY);
      if (obstacle) {
        // 計算與障礙物的交點
        const dx = extendedX - ghostBall.x;
        const dy = extendedY - ghostBall.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / length;
        const unitY = dy / length;

        // 獲取從幻影球到障礙邊緣的距離
        const distanceToBall =
          Math.sqrt((obstacle.x - ghostBall.x) ** 2 + (obstacle.y - ghostBall.y) ** 2) - obstacle.TABLE_RADIUS;

        // 將交點添加到路徑
        const intersectionX = ghostBall.x + unitX * distanceToBall;
        const intersectionY = ghostBall.y + unitY * distanceToBall;
        path.push({ x: intersectionX, y: intersectionY });

        setCalculatedPath(path);
        if (onPathCalculated) onPathCalculated(path);
        return;
      }

      // 檢查目標球是否在路徑上
      const targetOnPath = lineIntersectsBall(ghostBall.x, ghostBall.y, extendedX, extendedY, targetBall);

      if (targetOnPath) {
        // 將目標球添加到路徑
        path.push({ x: targetBall.x, y: targetBall.y });
      } else {
        // 添加延伸點以顯示方向
        path.push({ x: extendedX, y: extendedY });
      }

      setCalculatedPath(path);
      if (onPathCalculated) onPathCalculated(path);
      return;
    }

    // 對於1+庫的情況，計算含庫的路徑
    let cushionCount = 0;
    const maxIterations = 20; // 安全限制，防止無限循環
    let iterations = 0;

    while (cushionCount < selectedCushions && iterations < maxIterations) {
      iterations++;

      // 獲取淺藍色區域的碰撞邊界
      const tableBounds = {
        left: tableDimensions.cushionWidth + tableDimensions.innerPadding,
        right: width - tableDimensions.cushionWidth - tableDimensions.innerPadding,
        top: tableDimensions.cushionWidth + tableDimensions.innerPadding,
        bottom: height - tableDimensions.cushionWidth - tableDimensions.innerPadding,
      };

      // 使用改進的庫邊碰撞檢測函數
      const intersection = findCushionIntersection(posX, posY, velocX, velocY, tableBounds);

      if (intersection) {
        const { hitPoint, hitNormal } = intersection;

        // 檢查碰撞點前是否有障礙物
        const obstacle = checkPathObstruction(posX, posY, hitPoint.x, hitPoint.y);
        if (obstacle) {
          // 計算與障礙物的交點
          const dx = hitPoint.x - posX;
          const dy = hitPoint.y - posY;
          const length = Math.sqrt(dx * dx + dy * dy);
          const unitX = dx / length;
          const unitY = dy / length;

          // 獲取從當前位置到障礙邊緣的距離
          const distanceToBall = Math.sqrt((obstacle.x - posX) ** 2 + (obstacle.y - posY) ** 2) - obstacle.TABLE_RADIUS;

          // 將交點添加到路徑
          const intersectionX = posX + unitX * distanceToBall;
          const intersectionY = posY + unitY * distanceToBall;
          path.push({ x: intersectionX, y: intersectionY });

          setCalculatedPath(path);
          if (onPathCalculated) onPathCalculated(path);
          return;
        }

        // 將碰撞點添加到路徑 - 確保這些點位於實際的碰撞邊界上
        path.push({
          x: Number(hitPoint.x.toFixed(10)), // 移除潛在的浮點數誤差
          y: Number(hitPoint.y.toFixed(10)),
        });

        // 使用改進的反射計算
        // 標準化入射向量
        const incidentLength = Math.sqrt(velocX * velocX + velocY * velocY);
        const unitIncidentX = velocX / incidentLength;
        const unitIncidentY = velocY / incidentLength;

        // 標準化法向量
        const normalLength = Math.sqrt(hitNormal.x * hitNormal.x + hitNormal.y * hitNormal.y);
        const unitNormalX = hitNormal.x / normalLength;
        const unitNormalY = hitNormal.y / normalLength;

        // 計算入射向量與法向量的點積
        const dotProduct = unitIncidentX * unitNormalX + unitIncidentY * unitNormalY;

        // 計算反射向量
        const reflectionX = unitIncidentX - 2 * dotProduct * unitNormalX;
        const reflectionY = unitIncidentY - 2 * dotProduct * unitNormalY;

        // 標準化反射向量
        const reflectionLength = Math.sqrt(reflectionX * reflectionX + reflectionY * reflectionY);

        // 更新位置和方向準備下一輪迭代
        posX = hitPoint.x;
        posY = hitPoint.y;
        velocX = reflectionX / reflectionLength;
        velocY = reflectionY / reflectionLength;

        cushionCount++;
      } else {
        // 應該不會發生，除非有錯誤
        break;
      }
    }

    // 達到所需的庫數後，沿當前方向繼續
    if (cushionCount === selectedCushions) {
      // 沿行進方向延伸
      const extendedX = posX + velocX * 1000; // 任意大的距離
      const extendedY = posY + velocY * 1000;

      // 檢查最終路徑上是否有障礙物
      const obstacle = checkPathObstruction(posX, posY, extendedX, extendedY);
      if (obstacle) {
        // 計算與障礙物的交點
        const dx = extendedX - posX;
        const dy = extendedY - posY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / length;
        const unitY = dy / length;

        // 獲取從當前位置到障礙邊緣的距離
        const distanceToBall = Math.sqrt((obstacle.x - posX) ** 2 + (obstacle.y - posY) ** 2) - obstacle.TABLE_RADIUS;

        // 將交點添加到路徑
        const intersectionX = posX + unitX * distanceToBall;
        const intersectionY = posY + unitY * distanceToBall;
        path.push({ x: intersectionX, y: intersectionY });
      } else {
        // 檢查所需庫數後是否擊中目標球
        const targetOnPath = lineIntersectsBall(posX, posY, extendedX, extendedY, targetBall);
        if (targetOnPath) {
          // 將目標球添加到路徑
          path.push({ x: targetBall.x, y: targetBall.y });
        } else {
          // 添加延伸點以顯示方向
          path.push({ x: extendedX, y: extendedY });
        }
      }
    }

    setCalculatedPath(path);
    if (onPathCalculated) onPathCalculated(path);
  }, [
    checkPathObstruction,
    findCushionIntersection,
    getCueBall,
    getGhostBall,
    getTargetBall,
    height,
    lineIntersectsBall,
    onPathCalculated,
    selectedCushions,
    tableDimensions,
    width,
  ]);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // 檢查是否有球正在被拖動
      const anyBallDragging = [...balls, ...obstacleBalls].some((ball) => ball.isDragging);
      if (!anyBallDragging) return;

      // 直接應用球的新位置並計算路徑
      // 這樣更新會更及時
      const updateAndCalculate = () => {
        // 設置一個計時器來延遲計算，確保能捕捉更多的運動
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
        }

        timeoutIdRef.current = setTimeout(() => {
          calculatePath();
          timeoutIdRef.current = null;
        }, 0) as unknown as number; // 0ms 的延遲，保持流暢度
      };

      // 更新主要球的位置
      setBalls((prevBalls) => {
        const newBalls = prevBalls.map((ball) => {
          if (ball.isDragging) {
            // 限制在淺藍色區域邊界內
            const constrainedX = Math.max(
              tableDimensions.cushionWidth + tableDimensions.innerPadding + ball.TABLE_RADIUS,
              Math.min(width - tableDimensions.cushionWidth - tableDimensions.innerPadding - ball.TABLE_RADIUS, x)
            );
            const constrainedY = Math.max(
              tableDimensions.cushionWidth + tableDimensions.innerPadding + ball.TABLE_RADIUS,
              Math.min(height - tableDimensions.cushionWidth - tableDimensions.innerPadding - ball.TABLE_RADIUS, y)
            );

            return { ...ball, x: constrainedX, y: constrainedY };
          }
          return ball;
        });

        // 執行位置更新後立即安排路徑計算
        updateAndCalculate();

        return newBalls;
      });

      // 更新障礙球的位置
      setObstacleBalls((prevBalls) => {
        const newBalls = prevBalls.map((ball) => {
          if (ball.isDragging) {
            // 限制在淺藍色區域邊界內
            const constrainedX = Math.max(
              tableDimensions.cushionWidth + tableDimensions.innerPadding + ball.TABLE_RADIUS,
              Math.min(width - tableDimensions.cushionWidth - tableDimensions.innerPadding - ball.TABLE_RADIUS, x)
            );
            const constrainedY = Math.max(
              tableDimensions.cushionWidth + tableDimensions.innerPadding + ball.TABLE_RADIUS,
              Math.min(height - tableDimensions.cushionWidth - tableDimensions.innerPadding - ball.TABLE_RADIUS, y)
            );

            return { ...ball, x: constrainedX, y: constrainedY };
          }
          return ball;
        });

        // 執行位置更新後立即安排路徑計算
        updateAndCalculate();

        return newBalls;
      });
    },
    [balls, obstacleBalls, calculatePath, tableDimensions, width, height]
  ) as MouseMoveHandler;

  const handleMouseUp = useCallback(() => {
    setBalls((prevBalls) => {
      // Check if any balls were being dragged
      const wasDragging = prevBalls.some((ball) => ball.isDragging);

      // Set all isDragging to false
      const updatedBalls = prevBalls.map((ball) => ({ ...ball, isDragging: false }));

      // Schedule calculation in the next frame if there was dragging
      if (wasDragging) {
        requestAnimationFrame(() => calculatePath());
      }

      return updatedBalls;
    });

    setObstacleBalls((prevBalls) => {
      const wasDragging = prevBalls.some((ball) => ball.isDragging);
      const updatedBalls = prevBalls.map((ball) => ({ ...ball, isDragging: false }));

      if (wasDragging) {
        requestAnimationFrame(() => calculatePath());
      }

      return updatedBalls;
    });
  }, [calculatePath]);

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

  // Handle cushion selections
  const handleCushionChange = useCallback(
    (value: number) => {
      setSelectedCushions(value);
      calculatePath();
    },
    [calculatePath]
  );

  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  // 確保所有球的初始位置都在淺藍色區域內
  useEffect(() => {
    // 調整球的初始位置到淺藍色區域內
    setBalls((prevBalls) =>
      prevBalls.map((ball) => {
        const constrainedX = Math.max(
          tableDimensions.cushionWidth + tableDimensions.innerPadding + ball.TABLE_RADIUS,
          Math.min(width - tableDimensions.cushionWidth - tableDimensions.innerPadding - ball.TABLE_RADIUS, ball.x)
        );
        const constrainedY = Math.max(
          tableDimensions.cushionWidth + tableDimensions.innerPadding + ball.TABLE_RADIUS,
          Math.min(height - tableDimensions.cushionWidth - tableDimensions.innerPadding - ball.TABLE_RADIUS, ball.y)
        );
        return { ...ball, x: constrainedX, y: constrainedY };
      })
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize path calculation on component mount only
  useEffect(() => {
    calculatePath();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array so it only runs once on mount

  // Add a separate effect to update the path when positions change
  useEffect(() => {
    // Only recalculate if no balls are being dragged
    const anyBallDragging = [...balls, ...obstacleBalls].some((ball) => ball.isDragging);
    if (!anyBallDragging) {
      calculatePath();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCushions]); // Only recalculate when cushion selection changes

  // Draw when component updates
  useEffect(() => {
    // Render table, balls, and path
    const drawTable = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw table frame
      ctx.fillStyle = '#262626';
      ctx.beginPath();
      // 從左上開始順時鐘繪製桌子圓角
      ctx.moveTo(TABLE_RADIUS, 0);
      // 上面
      ctx.lineTo(width - TABLE_RADIUS, 0);
      ctx.arcTo(width, 0, width, TABLE_RADIUS, TABLE_RADIUS);
      // 右邊
      ctx.lineTo(width, height - TABLE_RADIUS);
      ctx.arcTo(width, height, width - TABLE_RADIUS, height, TABLE_RADIUS);
      // 下面
      ctx.lineTo(TABLE_RADIUS, height);
      ctx.arcTo(0, height, 0, height - TABLE_RADIUS, TABLE_RADIUS);
      // 左邊
      ctx.lineTo(0, TABLE_RADIUS);
      ctx.arcTo(0, 0, TABLE_RADIUS, 0, TABLE_RADIUS);
      ctx.closePath();
      ctx.fill();

      // Draw table surface
      ctx.fillStyle = '#0084D9';
      ctx.fillRect(
        tableDimensions.cushionWidth,
        tableDimensions.cushionWidth,
        width - 2 * tableDimensions.cushionWidth,
        height - 2 * tableDimensions.cushionWidth
      );

      // Draw table surface
      ctx.fillStyle = '#0093F3';
      ctx.fillRect(
        tableDimensions.cushionWidth + tableDimensions.innerPadding,
        tableDimensions.cushionWidth + tableDimensions.innerPadding,
        width - 2 * tableDimensions.cushionWidth - 2 * tableDimensions.innerPadding,
        height - 2 * tableDimensions.cushionWidth - 2 * tableDimensions.innerPadding
      );

      // Draw corner pockets with proper angle cuts
      const cornerPockets = [
        { x: tableDimensions.cushionWidth, y: tableDimensions.cushionWidth }, // Top left
        { x: width - tableDimensions.cushionWidth, y: tableDimensions.cushionWidth }, // Top right
        { x: tableDimensions.cushionWidth, y: height - tableDimensions.cushionWidth }, // Bottom left
        { x: width - tableDimensions.cushionWidth, y: height - tableDimensions.cushionWidth }, // Bottom right
      ];

      // Draw corner pockets
      cornerPockets.forEach((pocket) => {
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, tableDimensions.pocketRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#262626';
        ctx.fill();
      });

      // Draw side pockets (slightly differently)
      const sidePockets = [
        { x: width / 2, y: tableDimensions.cushionWidth - 5 }, // Top center
        { x: width / 2, y: height - tableDimensions.cushionWidth + 5 }, // Bottom center
      ];

      sidePockets.forEach((pocket) => {
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, tableDimensions.pocketRadius - 5, 0, Math.PI * 2);
        ctx.fillStyle = '#262626';
        ctx.fill();
      });

      // Draw white dots between pockets
      const drawWhiteDots = (start: { x: number; y: number }, end: { x: number; y: number }, count: number) => {
        for (let i = 1; i <= count; i++) {
          const dotX = start.x + (end.x - start.x) * (i / (count + 1));
          const dotY = start.y + (end.y - start.y) * (i / (count + 1));

          // 菱形的大小（可以调整）
          const size = 3;

          // 绘制菱形
          ctx.beginPath();
          ctx.moveTo(dotX, dotY - size); // 上点
          ctx.lineTo(dotX + size, dotY); // 右点
          ctx.lineTo(dotX, dotY + size); // 下点
          ctx.lineTo(dotX - size, dotY); // 左点
          ctx.closePath();

          ctx.fillStyle = 'white';
          ctx.fill();
        }
      };

      // Draw dots between corner pockets (3 dots between each pair)
      drawWhiteDots(cornerPockets[1], cornerPockets[3], 3); // Right edge
      drawWhiteDots(cornerPockets[2], cornerPockets[0], 3); // Left edge

      // Draw horizontal dots between top and bottom side pockets (6 dots)
      drawWhiteDots(
        { x: tableDimensions.cushionWidth, y: sidePockets[0].y + 5 },
        { x: width - tableDimensions.cushionWidth, y: sidePockets[0].y + 5 },
        7
      ); // Top edge
      drawWhiteDots(
        { x: tableDimensions.cushionWidth, y: sidePockets[1].y - 5 },
        { x: width - tableDimensions.cushionWidth, y: sidePockets[1].y - 5 },
        7
      ); // Bottom edge

      // 繪製數字標記
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'red'; // 使用紅色來顯示標記數字

      if (displayMarkers) {
        // 繪製頂部標記
        tableMarkers
          .filter((marker) => (!reverseMarkers ? marker.position === 'top' : marker.position === 'bottom'))
          .forEach((marker) => {
            const x = tableDimensions.cushionWidth + (width - 2 * tableDimensions.cushionWidth) * marker.offset;
            const y = tableDimensions.cushionWidth / 2;
            ctx.fillText(marker.value, x, y);
          });

        // 繪製底部標記
        tableMarkers
          .filter((marker) => (!reverseMarkers ? marker.position === 'bottom' : marker.position === 'top'))
          .forEach((marker) => {
            const x = tableDimensions.cushionWidth + (width - 2 * tableDimensions.cushionWidth) * marker.offset;
            const y = height - tableDimensions.cushionWidth / 2;
            ctx.fillText(marker.value, x, y);
          });

        // 繪製右邊標記
        tableMarkers
          .filter((marker) => (!reverseMarkers ? marker.position === 'right' : marker.position === 'rightReverse'))
          .forEach((marker) => {
            const x = width - tableDimensions.cushionWidth / 2;
            const y = tableDimensions.cushionWidth + (height - 2 * tableDimensions.cushionWidth) * marker.offset;
            ctx.fillText(marker.value, x, y);
          });
      }

      // Draw path
      if (calculatedPath.length > 1) {
        ctx.beginPath();
        ctx.moveTo(calculatedPath[0].x, calculatedPath[0].y);
        for (let i = 1; i < calculatedPath.length; i++) {
          ctx.lineTo(calculatedPath[i].x, calculatedPath[i].y);
        }
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = pathWidth;
        ctx.stroke();
      }

      // Draw balls
      const allBalls = [...balls, ...obstacleBalls];
      allBalls.forEach((ball) => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.TABLE_RADIUS, 0, Math.PI * 2);

        if (ball.id === 'ghostBall') {
          // Ghost ball is drawn with dashed stroke
          ctx.setLineDash([5, 3]);
          ctx.strokeStyle = 'white';
          ctx.fillStyle = '#00000050';
          ctx.fill();
          ctx.lineWidth = GHOST_BALL_STROKE_WIDTH;
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          // Regular balls are filled
          ctx.fillStyle = ball.color;
          ctx.fill();
        }
      });
    };

    drawTable();
  }, [
    balls,
    calculatedPath,
    displayMarkers,
    height,
    obstacleBalls,
    pathWidth,
    reverseMarkers,
    tableDimensions,
    tableMarkers,
    width,
    TABLE_RADIUS,
    GHOST_BALL_STROKE_WIDTH,
  ]);

  return (
    <section className="bg-foreground p-4 rounded-2xl">
      <div ref={containerRef} className={`w-[${width}] h-[${height + 40}] relative flex flex-col ${className}`}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onContextMenu={handleContextMenu}
          style={{ cursor: 'pointer' }}
        />
        <div className="flex items-center justify-center p-2 gap-2">
          <div className="flex items-center justify-center p-2 gap-2">
            <span className="text-background">兩顆星數字標記:</span>
            <Button
              onClick={() => setDisplayMarkers(!displayMarkers)}
              text={displayMarkers ? '隱藏' : '顯示'}
              buttonStyle={!displayMarkers ? ButtonStyleType.Active : ButtonStyleType.Disabled}
            />
          </div>

          <div className="flex items-center justify-center p-2 gap-2">
            <span className="text-background">顛倒標記:</span>
            <Button
              onClick={() => setReverseMarkers(!reverseMarkers)}
              disabled={!displayMarkers}
              text={!displayMarkers ? '隱藏' : reverseMarkers ? '顛倒' : '正常'}
              buttonStyle={
                !displayMarkers
                  ? ButtonStyleType.Warning
                  : !reverseMarkers
                    ? ButtonStyleType.Active
                    : ButtonStyleType.Disabled
              }
            />
          </div>

          <div className="flex items-center justify-center p-2 gap-2">
            <span className="text-background">瞄準線:</span>
            <Button
              onClick={() => (pathWidth < 30 ? setPathWidth(pathWidth + 2) : alert('啊你是要多寬?'))}
              element={<>+</>}
              className="bg-link hover:scale-105 text-background px-4 py-2 rounded-lg text-center"
            />
            <Button
              onClick={() => (pathWidth > 2 ? setPathWidth(pathWidth - 2) : alert('這麼細你瞄不到啦!'))}
              element={<>-</>}
              className="bg-link hover:scale-105 text-background px-3 py-1 rounded-lg text-center"
            />
          </div>
        </div>
        <div className="flex items-center justify-center p-2 gap-2">
          <span className="text-background">顆星次數:</span>
          {[0, 1, 2, 3, 4, 5].map((num) => (
            <Button
              key={num}
              onClick={() => handleCushionChange(num)}
              buttonStyle={selectedCushions === num ? ButtonStyleType.Active : ButtonStyleType.Disabled}
              text={num.toString()}
            />
          ))}
          <Button onClick={() => setObstacleBalls([])} text="清除障礙球" />
        </div>
      </div>
    </section>
  );
};

export default BilliardCushionCalculation;
