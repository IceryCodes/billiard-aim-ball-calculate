'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Konva from 'konva';
import { Vector2d } from 'konva/lib/types';
import { Layer, Stage } from 'react-konva';

import Ball from './Ball';
import BilliardTable from './BilliardTable';
import ControlPanel from './ControlPanel';
import { BallType, EnglishType, MarkerType, PathPoint, TableDimensions } from './interfaces';
import PathLine from './PathLine';

interface CushionCalculatorProps {
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

// 根據實際圖片比例計算邊界
const LEFT_RATIO = 0.068;
const RIGHT_RATIO = 0.06;
const TOP_RATIO = 0.115;
const BOTTOM_RATIO = 0.115;

const SPIN_OFFSET = 0.3; // 旋轉值偏移量
const STRENGTH_OFFSET = 0.1; // 擊球力度偏移量

const CushionCalculator: React.FC<CushionCalculatorProps> = ({ width = 800, height = 400, onPathCalculated }) => {
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
  const [displayMarkers, setDisplayMarkers] = useState<MarkerType>(MarkerType.NONE);
  const [reverseMarkers, setReverseMarkers] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1);
  const [englishValue, setEnglishValue] = useState<EnglishType>(EnglishType.NONE);
  const [spinValue, setSpinValue] = useState<number>(0);
  const [strengthValue, setStrengthValue] = useState<number>(0);
  const [shouldRecalculate, setShouldRecalculate] = useState<boolean>(false);

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

  const determineSpinEffect = useCallback(
    (englishValue: EnglishType, velocX: number, velocY: number, hitNormal: { x: number; y: number }): number => {
      if (englishValue === EnglishType.NONE) return 0;

      // 核心概念：
      // 左塞 = 球逆時鐘旋轉
      // 右塞 = 球順時鐘旋轉
      // 順塞 = 旋轉有助於增加反彈角度
      // 反塞 = 旋轉會減少反彈角度

      // 計算球的移動方向向量（單位化）
      const speed = Math.sqrt(velocX * velocX + velocY * velocY);
      if (speed < 0.001) return 0;

      const dirX = velocX / speed;
      const dirY = velocY / speed;

      // 計算切線向量（沿著撞擊面，垂直於法線）
      // 法線 (nx, ny) 的切線是 (-ny, nx) 或 (ny, -nx)
      // 我們選擇與球運動方向較一致的切線方向
      const tangent1X = -hitNormal.y;
      const tangent1Y = hitNormal.x;
      const tangent2X = hitNormal.y;
      const tangent2Y = -hitNormal.x;

      // 選擇與球運動方向夾角較小的切線
      const dot1 = dirX * tangent1X + dirY * tangent1Y;
      const dot2 = dirX * tangent2X + dirY * tangent2Y;

      const tangentX = Math.abs(dot1) > Math.abs(dot2) ? tangent1X : tangent2X;
      const tangentY = Math.abs(dot1) > Math.abs(dot2) ? tangent1Y : tangent2Y;

      // 計算球的旋轉方向對反彈的影響
      // 左塞（逆時鐘）：如果切線方向與旋轉方向一致，則為順塞
      // 右塞（順時鐘）：如果切線方向與旋轉方向一致，則為順塞

      // 使用叉積判斷旋轉效果
      // 球運動方向 × 切線方向 的結果可以告訴我們旋轉的影響
      const crossProduct = dirX * tangentY - dirY * tangentX;

      if (englishValue === EnglishType.LEFT) {
        // 左塞（逆時鐘旋轉）
        // 如果叉積為正，表示切線方向有利於左旋，所以是順塞
        return crossProduct > 0 ? 1 : -1;
      } else if (englishValue === EnglishType.RIGHT) {
        // 右塞（順時鐘旋轉）
        // 如果叉積為負，表示切線方向有利於右旋，所以是順塞
        return crossProduct < 0 ? 1 : -1;
      }

      return 0;
    },
    []
  );

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
      const minX = width * LEFT_RATIO + BALL_RADIUS;
      const maxX = width * (1 - RIGHT_RATIO) - BALL_RADIUS;
      const minY = height * TOP_RATIO + BALL_RADIUS;
      const maxY = height * (1 - BOTTOM_RATIO) - BALL_RADIUS;

      return {
        x: Math.max(minX, Math.min(maxX, x)),
        y: Math.max(minY, Math.min(maxY, y)),
      };
    },
    [BALL_RADIUS, height, width]
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

      // 使用與 constrainBallPosition 相同的比例來計算碰撞邊界
      const tableBounds = {
        left: width * LEFT_RATIO,
        right: width * (1 - RIGHT_RATIO),
        top: height * TOP_RATIO,
        bottom: height * (1 - BOTTOM_RATIO),
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

        let reflectionX = unitIncidentX - 2 * dotProduct * unitNormalX;
        let reflectionY = unitIncidentY - 2 * dotProduct * unitNormalY;

        // 應用旋轉效果（根據反射次數調整強度）
        if (englishValue !== EnglishType.NONE) {
          const spinEffect = determineSpinEffect(englishValue, velocX, velocY, hitNormal);

          // 根據反射次數調整旋轉效果的強度
          let spinMultiplier = 1;
          let strengthMultiplier = 1;

          if (cushionCount === 0) {
            // 第一次反射：最強的效果
            spinMultiplier = 1;
            strengthMultiplier = 1;
          } else if (cushionCount === 1) {
            // 第二次反射：中等效果
            spinMultiplier = 1.5;
            strengthMultiplier = 0; // 第二次反射不再受擊球力度影響
          } else if (cushionCount === 2) {
            // 第三次反射：較弱效果
            spinMultiplier = 1.2;
            strengthMultiplier = 0;
          } else {
            // 更多次反射：效果逐漸減弱
            spinMultiplier = 1.0;
            strengthMultiplier = 0;
          }

          const spinAdjustment = spinValue * SPIN_OFFSET * spinMultiplier * spinEffect;
          const strengthAdjustment = strengthValue * STRENGTH_OFFSET * strengthMultiplier * spinEffect;

          // 計算切線向量（垂直於法線）
          const tangentX = -unitNormalY;
          const tangentY = unitNormalX;

          // 調整反射向量
          reflectionX += tangentX * spinAdjustment + tangentX * strengthAdjustment;
          reflectionY += tangentY * spinAdjustment + tangentY * strengthAdjustment;
        }

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
    getCueBall,
    getGhostBall,
    getTargetBall,
    selectedCushions,
    width,
    height,
    englishValue,
    spinValue,
    strengthValue,
    checkPathObstruction,
    calculateIntersectionPoint,
    lineIntersectsBall,
    findCushionIntersection,
    determineSpinEffect,
    onPathCalculated,
  ]);

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

      // 拖動結束後立即觸發重新計算
      setShouldRecalculate(true);
    },
    [balls, constrainBallPosition]
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

      // 使用節流來避免過度計算
      if (timeoutIdRef.current) {
        cancelAnimationFrame(timeoutIdRef.current);
      }

      timeoutIdRef.current = requestAnimationFrame(() => {
        setShouldRecalculate(true); // 設置標記，觸發重新計算
        timeoutIdRef.current = null;
      });
    },
    [balls, constrainBallPosition]
  );

  const handleAddBlockBall = useCallback(
    (pos?: Vector2d) => {
      let usedPos: Vector2d = { x: width / 2, y: height / 2 };
      if (pos) usedPos = pos;

      // 確保新球的位置在合法範圍內（淺藍色球檯區域）
      const { x: constrainedX, y: constrainedY } = constrainBallPosition(usedPos.x / scale, usedPos.y / scale);

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
    },
    [BALL_RADIUS, balls, calculatePath, constrainBallPosition, height, nextObstacleId, obstacleBalls, scale, width]
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

        handleAddBlockBall(pos);
      }
    },
    [handleAddBlockBall]
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
          englishValue={englishValue}
          setEnglishValue={setEnglishValue}
          spinValue={spinValue}
          setSpinValue={setSpinValue}
          strengthValue={strengthValue}
          setStrengthValue={setStrengthValue}
          handleAddBlockBall={handleAddBlockBall}
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

export default CushionCalculator;
