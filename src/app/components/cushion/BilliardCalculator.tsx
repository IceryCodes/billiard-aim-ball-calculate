'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Konva from 'konva';
import { Layer, Stage } from 'react-konva';

import Ball from './Ball';
import BilliardTable from './BilliardTable';
import ControlPanel from './ControlPanel';
import PathLine from './PathLine';

// 類型定義
export interface BallType {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  draggable: boolean;
  isDashed?: boolean;
}

export interface PathPoint {
  x: number;
  y: number;
}

export interface TableDimensions {
  width: number;
  height: number;
  cushionWidth: number;
  pocketRadius: number;
  innerPadding: number;
}

export interface TableMarker {
  position: 'top' | 'bottom' | 'right' | 'rightReverse';
  value: string;
  offset: number;
}

interface BilliardCalculatorProps {
  width?: number;
  height?: number;
  onPathCalculated?: (path: PathPoint[]) => void;
}

// Konva 事件類型
interface KonvaMouseEvent {
  evt: MouseEvent;
  target: Konva.Node;
  currentTarget: Konva.Node;
  type: string;
  cancelBubble: boolean;
}

const BilliardCalculator: React.FC<BilliardCalculatorProps> = ({ width = 800, height = 400, onPathCalculated }) => {
  // 參數和常數
  const calculateBallRadius = useCallback(() => {
    const tableWidth = width - 60;
    return Math.max(tableWidth / 70, 8);
  }, [width]);

  const BALL_RADIUS = calculateBallRadius();
  const stageRef = useRef<Konva.Stage | null>(null);
  const timeoutIdRef = useRef<number | null>(null);

  // 撞球桌尺寸
  const tableDimensions = useMemo((): TableDimensions => {
    const cushionWidth = Math.max(width / 20, 20);
    return {
      width: width - cushionWidth * 2,
      height: height - cushionWidth * 2,
      cushionWidth,
      pocketRadius: Math.max(cushionWidth * 0.85, 18),
      innerPadding: Math.max(cushionWidth / 6, 3),
    };
  }, [height, width]);

  // 其餘狀態保持不變
  const [selectedCushions, setSelectedCushions] = useState<number>(0);
  const [balls, setBalls] = useState<BallType[]>([
    { id: 'cueBall', x: width / 4, y: height / 2, radius: BALL_RADIUS, color: 'white', draggable: true },
    {
      id: 'ghostBall',
      x: width / 3,
      y: height / 2,
      radius: BALL_RADIUS,
      color: 'rgba(0,0,0,0.3)',
      draggable: true,
      isDashed: true,
    },
    { id: 'targetBall', x: (width * 3) / 4, y: height / 2, radius: BALL_RADIUS, color: 'red', draggable: true },
  ]);
  const [obstacleBalls, setObstacleBalls] = useState<BallType[]>([]);
  const [calculatedPath, setCalculatedPath] = useState<PathPoint[]>([]);
  const [nextObstacleId, setNextObstacleId] = useState<number>(1);
  const [pathWidth, setPathWidth] = useState<number>(3);
  const [displayMarkers, setDisplayMarkers] = useState<boolean>(false);
  const [reverseMarkers, setReverseMarkers] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1);

  const renderBalls = useMemo((): BallType[] => [...balls, ...obstacleBalls], [balls, obstacleBalls]);

  // 球位置的參考函數
  const getCueBall = useCallback(() => {
    return balls.find((ball) => ball.id === 'cueBall');
  }, [balls]);

  const getGhostBall = useCallback(() => {
    return balls.find((ball) => ball.id === 'ghostBall');
  }, [balls]);

  const getTargetBall = useCallback((): BallType => {
    const targetBall: BallType | undefined = balls.find((ball) => ball.id === 'targetBall');
    return targetBall ? targetBall : { id: '', x: 0, y: 0, radius: 0, color: '', draggable: false };
  }, [balls]);

  // 碰撞檢測函數
  const lineIntersectsBall = useCallback((x1: number, y1: number, x2: number, y2: number, ball: BallType): boolean => {
    // 向量計算：線段起點到球心
    const vx = ball.x - x1;
    const vy = ball.y - y1;

    // 線段向量
    const sx = x2 - x1;
    const sy = y2 - y1;

    // 線段長度平方
    const segmentLengthSquared = sx * sx + sy * sy;
    if (segmentLengthSquared < 0.0001) {
      // 近乎零長度的線段
      // 直接檢查到點的距離
      return Math.sqrt(vx * vx + vy * vy) <= ball.radius + 2;
    }

    // 將向量投影到線段上
    const t = Math.max(0, Math.min(1, (vx * sx + vy * sy) / segmentLengthSquared));

    // 計算線段上最接近球心的點
    const closestX = x1 + t * sx;
    const closestY = y1 + t * sy;

    // 計算球心到最近點的距離平方
    const distanceSquared = (ball.x - closestX) * (ball.x - closestX) + (ball.y - closestY) * (ball.y - closestY);

    // 增加一個更大的容差值，確保碰撞檢測更加可靠
    const EPSILON = 0;
    return distanceSquared <= (ball.radius + EPSILON) * (ball.radius + EPSILON);
  }, []);

  const constrainBallPosition = useCallback(
    (x: number, y: number): { x: number; y: number } => {
      const minX = tableDimensions.cushionWidth + tableDimensions.innerPadding + BALL_RADIUS;
      const maxX = width - tableDimensions.cushionWidth - tableDimensions.innerPadding - BALL_RADIUS;
      const minY = tableDimensions.cushionWidth + tableDimensions.innerPadding + BALL_RADIUS;
      const maxY = height - tableDimensions.cushionWidth - tableDimensions.innerPadding - BALL_RADIUS;

      return {
        x: Math.max(minX, Math.min(maxX, x)),
        y: Math.max(minY, Math.min(maxY, y)),
      };
    },
    [BALL_RADIUS, height, tableDimensions, width]
  );

  // 障礙檢測
  const checkPathObstruction = useCallback(
    (x1: number, y1: number, x2: number, y2: number): BallType | null => {
      // 收集所有需要檢查的球（排除起始球）
      const ballsToCheck: BallType[] = [];

      // 添加所有障礙球
      for (const ball of obstacleBalls) {
        // 如果這是起點跳過
        if (Math.abs(x1 - ball.x) < 1 && Math.abs(y1 - ball.y) < 1) continue;
        ballsToCheck.push(ball);
      }

      // 添加目標球，但只有當我們不是從目標球開始時
      const targetBall = getTargetBall();
      if (targetBall && targetBall.id !== '' && (Math.abs(x1 - targetBall.x) > 1 || Math.abs(y1 - targetBall.y) > 1)) {
        ballsToCheck.push(targetBall);
      }

      // 按到起點的距離排序球體
      ballsToCheck.sort((a, b) => {
        const distA = (a.x - x1) * (a.x - x1) + (a.y - y1) * (a.y - y1);
        const distB = (b.x - x1) * (b.x - x1) + (b.y - y1) * (b.y - y1);
        return distA - distB;
      });

      // 檢查碰撞
      for (const ball of ballsToCheck) {
        if (lineIntersectsBall(x1, y1, x2, y2, ball)) {
          return ball;
        }
      }

      return null;
    },
    [obstacleBalls, getTargetBall, lineIntersectsBall]
  );

  const calculateIntersectionPoint = useCallback(
    (startX: number, startY: number, endX: number, endY: number, ball: BallType): { x: number; y: number } => {
      // 計算方向向量
      const dirX = endX - startX;
      const dirY = endY - startY;

      // 線段長度
      const length = Math.sqrt(dirX * dirX + dirY * dirY);
      if (length < 0.0001) {
        // 處理零長度線段
        return { x: startX, y: startY };
      }

      // 單位向量
      const unitX = dirX / length;
      const unitY = dirY / length;

      // 從起點到球心的向量
      const vx = ball.x - startX;
      const vy = ball.y - startY;

      // 計算球心到線的垂直距離
      const dot = vx * unitX + vy * unitY;
      const closestX = startX + dot * unitX;
      const closestY = startY + dot * unitY;

      // 檢查最近點是否在線段上
      const onSegment = dot >= 0 && dot <= length;

      // 如果最近點不在線段上，則交點為線段端點
      if (!onSegment) {
        const distToStart = Math.sqrt((ball.x - startX) * (ball.x - startX) + (ball.y - startY) * (ball.y - startY));
        const distToEnd = Math.sqrt((ball.x - endX) * (ball.x - endX) + (ball.y - endY) * (ball.y - endY));

        // 返回離球更近的端點
        if (distToStart <= distToEnd) {
          if (distToStart <= ball.radius) {
            // 起點已在球內，返回起點
            return { x: startX, y: startY };
          }

          // 計算從球心到起點的方向向量
          const dx = startX - ball.x;
          const dy = startY - ball.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // 返回球表面上的點
          return {
            x: ball.x + (dx / dist) * ball.radius,
            y: ball.y + (dy / dist) * ball.radius,
          };
        } else {
          if (distToEnd <= ball.radius) {
            // 終點已在球內，返回終點
            return { x: endX, y: endY };
          }

          // 計算從球心到終點的方向向量
          const dx = endX - ball.x;
          const dy = endY - ball.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // 返回球表面上的點
          return {
            x: ball.x + (dx / dist) * ball.radius,
            y: ball.y + (dy / dist) * ball.radius,
          };
        }
      }

      // 球心到線的距離
      const perpX = closestX - ball.x;
      const perpY = closestY - ball.y;
      const perpDist = Math.sqrt(perpX * perpX + perpY * perpY);

      // 檢查線是否穿過球體
      if (perpDist > ball.radius) {
        // 線沒有穿過球，不應該有交點
        return { x: endX, y: endY };
      }

      // 計算從最近點回退到球表面交點的距離
      const backDist = Math.sqrt(ball.radius * ball.radius - perpDist * perpDist);

      // 計算交點（順著原來方向)
      const intersectionX = closestX - backDist * unitX;
      const intersectionY = closestY - backDist * unitY;

      // 檢查交點是否在線段上
      const t = ((intersectionX - startX) * unitX + (intersectionY - startY) * unitY) / length;
      if (t >= 0 && t <= 1) {
        return { x: intersectionX, y: intersectionY };
      }

      // 如果交點不在線段上，使用線段的端點
      if (t < 0) {
        return { x: startX, y: startY };
      } else {
        return { x: endX, y: endY };
      }
    },
    []
  );

  // 顆星邊碰撞檢測
  const findCushionIntersection = useCallback(
    (
      posX: number,
      posY: number,
      velocX: number,
      velocY: number,
      tableBounds: { left: number; right: number; top: number; bottom: number }
    ) => {
      const EPSILON = 1e-10;
      let tMin = Infinity;
      let hitPoint = { x: 0, y: 0 };
      let hitNormal = { x: 0, y: 0 };

      // 檢查左側顆星邊
      if (Math.abs(velocX) > EPSILON && velocX < 0) {
        const t = (tableBounds.left - posX) / velocX;
        if (t >= 0 && t < tMin) {
          const yIntersect = posY + velocY * t;
          if (yIntersect >= tableBounds.top - EPSILON && yIntersect <= tableBounds.bottom + EPSILON) {
            tMin = t;
            hitPoint = {
              x: tableBounds.left,
              y: Math.max(tableBounds.top, Math.min(tableBounds.bottom, yIntersect)),
            };
            hitNormal = { x: 1, y: 0 };
          }
        }
      }

      // 右側顆星邊
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

      // 上側顆星邊
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

      // 下側顆星邊
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

  // 計算路徑函數
  const calculatePath = useCallback(() => {
    const cueBall = getCueBall();
    const ghostBall = getGhostBall();
    const targetBall = getTargetBall();

    if (!cueBall || !ghostBall || !targetBall) return;

    const path: PathPoint[] = [];
    const currentPoint = { x: cueBall.x, y: cueBall.y };
    path.push(currentPoint);

    // 從母球到瞄準球的方向
    const dirX = ghostBall.x - cueBall.x;
    const dirY = ghostBall.y - cueBall.y;
    const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);

    // 檢查母球和瞄準球之間是否有障礙
    const obstacleBetweenCueAndGhost = checkPathObstruction(cueBall.x, cueBall.y, ghostBall.x, ghostBall.y);
    if (obstacleBetweenCueAndGhost) {
      // 計算與障礙物的交點（精確到球體表面）
      const intersection = calculateIntersectionPoint(
        cueBall.x,
        cueBall.y,
        ghostBall.x,
        ghostBall.y,
        obstacleBetweenCueAndGhost
      );
      path.push({ x: intersection.x, y: intersection.y });

      setCalculatedPath(path);
      if (onPathCalculated) onPathCalculated(path);
      return;
    }

    // 將瞄準球添加到路徑
    path.push({ x: ghostBall.x, y: ghostBall.y });

    // 標準化方向向量
    const unitDirX = dirX / dirLength;
    const unitDirY = dirY / dirLength;

    // 零顆星情況，檢查是否直接打到目標球或障礙球
    if (selectedCushions === 0) {
      // 從瞄準球沿行進方向延伸
      const extendedX = ghostBall.x + unitDirX * 1000;
      const extendedY = ghostBall.y + unitDirY * 1000;

      // 先檢查是否有障礙物
      const obstacle = checkPathObstruction(ghostBall.x, ghostBall.y, extendedX, extendedY);
      if (obstacle) {
        // 計算與障礙物的交點（停在球體表面）
        const intersection = calculateIntersectionPoint(ghostBall.x, ghostBall.y, extendedX, extendedY, obstacle);
        path.push({ x: intersection.x, y: intersection.y });
        setCalculatedPath(path);
        if (onPathCalculated) onPathCalculated(path);
        return;
      }

      // 如果沒有障礙物，再檢查是否碰到目標球
      if (lineIntersectsBall(ghostBall.x, ghostBall.y, extendedX, extendedY, targetBall)) {
        // 計算與目標球的交點
        const intersection = calculateIntersectionPoint(ghostBall.x, ghostBall.y, extendedX, extendedY, targetBall);
        path.push({ x: intersection.x, y: intersection.y });
      } else {
        // 沒有碰到任何球，添加延伸點
        path.push({ x: extendedX, y: extendedY });
      }

      setCalculatedPath(path);
      if (onPathCalculated) onPathCalculated(path);
      return;
    }

    // 對於1+顆星的情況，計算含顆星的路徑
    let posX = ghostBall.x; // 從瞄準球開始
    let posY = ghostBall.y;
    let velocX = unitDirX; // 初始方向是從瞄準球指向的方向
    let velocY = unitDirY;

    let cushionCount = 0;
    const maxIterations = 20;
    let iterations = 0;

    while (cushionCount < selectedCushions && iterations < maxIterations) {
      iterations++;

      // 獲取淺藍色區域(球檯內)的碰撞邊界
      const tableBounds = {
        left: tableDimensions.cushionWidth + tableDimensions.innerPadding,
        right: width - tableDimensions.cushionWidth - tableDimensions.innerPadding,
        top: tableDimensions.cushionWidth + tableDimensions.innerPadding,
        bottom: height - tableDimensions.cushionWidth - tableDimensions.innerPadding,
      };

      // 檢查在到達邊界前是否會碰到任何球
      const extendedX = posX + velocX * 1000; // 沿當前方向延伸
      const extendedY = posY + velocY * 1000;
      const obstacle = checkPathObstruction(posX, posY, extendedX, extendedY);
      if (obstacle) {
        // 找到碰撞點並停止
        const intersection = calculateIntersectionPoint(posX, posY, extendedX, extendedY, obstacle);
        path.push({ x: intersection.x, y: intersection.y });
        setCalculatedPath(path);
        if (onPathCalculated) onPathCalculated(path);
        return;
      }

      // 使用顆星邊碰撞檢測函數
      const intersection = findCushionIntersection(posX, posY, velocX, velocY, tableBounds);

      if (intersection) {
        const { hitPoint, hitNormal } = intersection;

        // 檢查碰撞點前是否有障礙物
        const ballObstacle = checkPathObstruction(posX, posY, hitPoint.x, hitPoint.y);
        if (ballObstacle) {
          // 計算與障礙物的交點（停在球體表面）
          const ballIntersection = calculateIntersectionPoint(posX, posY, hitPoint.x, hitPoint.y, ballObstacle);
          path.push({ x: ballIntersection.x, y: ballIntersection.y });
          setCalculatedPath(path);
          if (onPathCalculated) onPathCalculated(path);
          return;
        }

        // 將碰撞點添加到路徑
        path.push({
          x: Number(hitPoint.x.toFixed(10)),
          y: Number(hitPoint.y.toFixed(10)),
        });

        // 計算反射
        const incidentLength = Math.sqrt(velocX * velocX + velocY * velocY);
        const unitIncidentX = velocX / incidentLength;
        const unitIncidentY = velocY / incidentLength;

        const normalLength = Math.sqrt(hitNormal.x * hitNormal.x + hitNormal.y * hitNormal.y);
        const unitNormalX = hitNormal.x / normalLength;
        const unitNormalY = hitNormal.y / normalLength;

        const dotProduct = unitIncidentX * unitNormalX + unitIncidentY * unitNormalY;

        const reflectionX = unitIncidentX - 2 * dotProduct * unitNormalX;
        const reflectionY = unitIncidentY - 2 * dotProduct * unitNormalY;

        const reflectionLength = Math.sqrt(reflectionX * reflectionX + reflectionY * reflectionY);

        // 更新位置和方向準備下一輪迭代
        posX = hitPoint.x;
        posY = hitPoint.y;
        velocX = reflectionX / reflectionLength;
        velocY = reflectionY / reflectionLength;

        cushionCount++;
      } else {
        break;
      }
    }

    // 達到所需的顆星數後，沿當前方向繼續
    if (cushionCount === selectedCushions) {
      // 沿行進方向延伸
      const extendedX = posX + velocX * 1000;
      const extendedY = posY + velocY * 1000;

      // 檢查路徑上是否有障礙物
      const obstacle = checkPathObstruction(posX, posY, extendedX, extendedY);
      if (obstacle) {
        // 計算與障礙物的交點（停在球體表面）
        const intersection = calculateIntersectionPoint(posX, posY, extendedX, extendedY, obstacle);
        path.push({ x: intersection.x, y: intersection.y });
      } else if (lineIntersectsBall(posX, posY, extendedX, extendedY, targetBall)) {
        // 計算與目標球的交點
        const intersection = calculateIntersectionPoint(posX, posY, extendedX, extendedY, targetBall);
        path.push({ x: intersection.x, y: intersection.y });
      } else {
        // 沒有碰到任何球，添加延伸點
        path.push({ x: extendedX, y: extendedY });
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
    calculateIntersectionPoint,
  ]);

  // 其餘函數與原來相同...

  const handleBallDragEnd = useCallback(
    (ballId: string, newX: number, newY: number) => {
      const { x: constrainedX, y: constrainedY } = constrainBallPosition(newX, newY);

      // 更新球的位置
      if (balls.some((ball) => ball.id === ballId)) {
        setBalls((prevBalls) =>
          prevBalls.map((ball) => (ball.id === ballId ? { ...ball, x: constrainedX, y: constrainedY } : ball))
        );
      } else {
        setObstacleBalls((prevBalls) =>
          prevBalls.map((ball) => (ball.id === ballId ? { ...ball, x: constrainedX, y: constrainedY } : ball))
        );
      }

      // 立即重新計算路徑
      calculatePath();
    },
    [balls, calculatePath, constrainBallPosition]
  );

  const handleBallDrag = useCallback(
    (ballId: string, newX: number, newY: number) => {
      const { x: constrainedX, y: constrainedY } = constrainBallPosition(newX, newY);

      // 更新球位置
      if (balls.some((ball) => ball.id === ballId)) {
        setBalls((prevBalls) =>
          prevBalls.map((ball) => (ball.id === ballId ? { ...ball, x: constrainedX, y: constrainedY } : ball))
        );
      } else {
        setObstacleBalls((prevBalls) =>
          prevBalls.map((ball) => (ball.id === ballId ? { ...ball, x: constrainedX, y: constrainedY } : ball))
        );
      }

      if (timeoutIdRef.current) {
        cancelAnimationFrame(timeoutIdRef.current);
      }

      timeoutIdRef.current = requestAnimationFrame(() => {
        calculatePath();
        timeoutIdRef.current = null;
      });
    },
    [balls, calculatePath, constrainBallPosition]
  );

  const handleStageClick = useCallback(
    (e: KonvaMouseEvent) => {
      // 右鍵點擊即可新增障礙球
      if (e.evt.button === 2) {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (!pos) return;

        // 確保新球的位置在合法範圍內（淺藍色球檯區域）
        const { x: constrainedX, y: constrainedY } = constrainBallPosition(pos.x / scale, pos.y / scale);

        // 添加新的障礙球
        const newObstacleBall: BallType = {
          id: `obstacle${nextObstacleId}`,
          x: constrainedX,
          y: constrainedY,
          radius: BALL_RADIUS,
          color: '#101010',
          draggable: true,
        };

        // 檢查新球是否與現有球重疊
        const isOverlapping = [...balls, ...obstacleBalls].some((ball) => {
          const dx = ball.x - constrainedX;
          const dy = ball.y - constrainedY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          return distance < ball.radius + BALL_RADIUS;
        });

        if (!isOverlapping) {
          setObstacleBalls((prev) => [...prev, newObstacleBall]);
          setNextObstacleId((prevId) => prevId + 1);
        }

        // 重新計算路徑
        calculatePath();
      }
    },
    [balls, obstacleBalls, constrainBallPosition, nextObstacleId, calculatePath, scale, BALL_RADIUS]
  );

  const initializeBallsRef = useRef<(() => void) | null>(null);
  initializeBallsRef.current = useCallback(() => {
    const initialBalls = [
      { id: 'cueBall', x: width / 4, y: height / 2, radius: BALL_RADIUS, color: 'white', draggable: true },
      {
        id: 'ghostBall',
        x: width / 3,
        y: height / 2,
        radius: BALL_RADIUS,
        color: 'rgba(0,0,0,0.3)',
        draggable: true,
        isDashed: true,
      },
      { id: 'targetBall', x: (width * 3) / 4, y: height / 2, radius: BALL_RADIUS, color: 'red', draggable: true },
    ].map((ball) => {
      const { x: constrainedX, y: constrainedY } = constrainBallPosition(ball.x, ball.y);
      return { ...ball, x: constrainedX, y: constrainedY };
    });

    setBalls(initialBalls);

    window.requestAnimationFrame(() => {
      calculatePath();
    });
  }, [width, height, constrainBallPosition, calculatePath, BALL_RADIUS]);

  const initializeBalls = useCallback(() => {
    if (initializeBallsRef.current) {
      initializeBallsRef.current();
    }
  }, []);

  // 處理撞球桌尺寸變化的RWD
  useEffect(() => {
    const handleResize = () => {
      // 更新 scale 確保完整顯示
      if (stageRef.current && stageRef.current.container) {
        const containerWidth = stageRef.current.container().clientWidth;
        const containerHeight = stageRef.current.container().clientHeight;

        // 計算最佳縮放比例
        const scaleX = containerWidth / width;
        const scaleY = containerHeight / height;
        const newScale = Math.min(scaleX, scaleY);

        setScale(newScale);
      }
    };

    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    }
  }, [width, height]);

  // 其他useEffect保持不變...

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const currentStageContainer = stageRef.current?.container();
    if (currentStageContainer) {
      currentStageContainer.addEventListener('contextmenu', handleContextMenu);
      return () => {
        currentStageContainer.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, []);

  useEffect(() => {
    calculatePath();
  }, [selectedCushions, displayMarkers, reverseMarkers, pathWidth, calculatePath]);

  useEffect(() => {
    calculatePath();
  }, [balls, obstacleBalls, calculatePath]);

  useEffect(() => {
    initializeBalls();
  }, [initializeBalls]);

  return (
    <div className="bg-foreground p-1 md:p-4 rounded-2xl">
      <div className="billiard-calculator">
        <div className="billiard-table-container mx-auto">
          <Stage width={width} height={height} ref={stageRef} scaleX={scale} scaleY={scale} onClick={handleStageClick}>
            <Layer>
              {/* 撞球桌 */}
              <BilliardTable
                width={width}
                height={height}
                tableDimensions={tableDimensions}
                displayMarkers={displayMarkers}
                reverseMarkers={reverseMarkers}
              />

              {/* 路徑線 */}
              <PathLine
                points={calculatedPath.flatMap((point) => [point.x, point.y])}
                strokeWidth={pathWidth}
                stroke="#FFFF00" // 純黃色路徑線
              />

              {/* 球 */}
              {renderBalls.map((ball) => (
                <Ball
                  key={ball.id}
                  ball={ball}
                  onDrag={(x, y) => handleBallDrag(ball.id, x, y)}
                  onDragEnd={(x, y) => handleBallDragEnd(ball.id, x, y)}
                />
              ))}
            </Layer>
          </Stage>
        </div>

        {/* 控制面板 */}
        <ControlPanel
          selectedCushions={selectedCushions}
          setSelectedCushions={setSelectedCushions}
          displayMarkers={displayMarkers}
          setDisplayMarkers={setDisplayMarkers}
          reverseMarkers={reverseMarkers}
          setReverseMarkers={setReverseMarkers}
          pathWidth={pathWidth}
          setPathWidth={setPathWidth}
          onClearObstacles={() => {
            setObstacleBalls([]);
            calculatePath();
          }}
          calculatePath={calculatePath}
        />
      </div>
    </div>
  );
};

export default BilliardCalculator;
