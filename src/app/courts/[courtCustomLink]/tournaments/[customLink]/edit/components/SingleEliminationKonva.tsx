'use client';

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import Konva from 'konva';
import { Group, Layer, Line, Rect, Stage, Text } from 'react-konva';

import { Match, Player } from '@/domains/tournament';

import { QRCodeCanvas } from '../../components/shared/TournamentShared';

import {
  boxHeight,
  boxWidth,
  canvasBottomPadding,
  canvasLeftPadding,
  canvasRightPadding,
  championBackgroundColor,
  championBoxHeight,
  championBoxWidth,
  championConnectionLineWidth,
  championNameFontSize,
  championStrokeWidth,
  championTextPaddingX,
  championTextWidth,
  championToFinalGap,
  championTopMargin,
  connectionLineColor,
  connectionLineWidth,
  crownIconFontSize,
  crownIconOffsetX,
  drawingLineCap,
  drawingLineJoin,
  DrawingMode,
  drawingStrokeColor,
  drawingStrokeWidth,
  fullscreenPositionX,
  fullscreenPositionY,
  fullscreenScale,
  headerHeight,
  highlightColor,
  mainLayerName,
  maxZoom,
  minZoom,
  optimalPositionX,
  optimalPositionY,
  optimalScale,
  playerSpacing,
  qrCodeOffsetX,
  qrCodeOffsetY,
  qrCodeSize,
  roundHeight,
  roundTitleFontSize,
  sceneHeightExtra,
  strokeColor,
  textColor,
  titlePadding,
  titleWidth,
  zoomStep,
} from './constants';
import { DrawingData, DrawingLine, SingleEliminationKonvaProps } from './interfaces';
import KonvaMatch from './KonvaMatch';

interface StageConfig {
  width: number;
  height: number;
  scale: number;
}

interface Position {
  x: number;
  y: number;
}

interface PositionCache {
  [key: string]: Position;
}

interface MousePoint {
  x: number;
  y: number;
}

export interface SingleEliminationKonvaRef {
  setOptimalView: () => void;
  setFullscreenView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setDrawingMode: (mode: DrawingMode) => void;
  clearDrawing: () => void;
}

const SingleEliminationKonva = forwardRef<SingleEliminationKonvaRef, SingleEliminationKonvaProps>(
  ({ players, matches, isEditMode, onMatchUpdate, drawingData, onDrawingUpdate }, ref) => {
    const rounds = Math.floor(Math.log2(players.length));
    const stageRef = useRef<Konva.Stage>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const drawingLayerRef = useRef<Konva.Layer>(null);

    // 繪圖狀態
    const [drawingMode, setDrawingMode] = useState<DrawingMode>(DrawingMode.NORMAL);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentLine, setCurrentLine] = useState<DrawingLine | null>(null);
    const [localDrawingData, setLocalDrawingData] = useState<DrawingData>(
      drawingData || { lines: [], lastUpdated: Date.now() }
    );

    // 定義虛擬場景尺寸
    const firstRoundMatches = players.length / 2;
    const matchesAreaWidth = firstRoundMatches * playerSpacing;
    const sceneWidth = titleWidth + canvasLeftPadding + matchesAreaWidth + canvasRightPadding;
    const sceneHeight = rounds * roundHeight + headerHeight + boxHeight + canvasBottomPadding + sceneHeightExtra;

    const [stageConfig, setStageConfig] = useState<StageConfig>({
      width: sceneWidth,
      height: sceneHeight,
      scale: 1,
    });

    // 修正的同步邏輯
    useEffect(() => {
      if (drawingData) {
        // 確保同步所有外部數據，不只是時間戳不同的
        if (
          drawingData.lastUpdated !== localDrawingData.lastUpdated ||
          drawingData.lines.length !== localDrawingData.lines.length
        ) {
          setLocalDrawingData(drawingData);
        }
      } else {
        setLocalDrawingData({ lines: [], lastUpdated: Date.now() });
      }
    }, [drawingData, localDrawingData.lastUpdated, localDrawingData.lines.length]);

    const updateStageSize = useCallback((): void => {
      if (!containerRef.current) return;

      const containerWidth: number = containerRef.current.offsetWidth;
      const containerHeight: number = containerRef.current.offsetHeight;

      setStageConfig({
        width: containerWidth,
        height: containerHeight,
        scale: 1,
      });
    }, []);

    const setOptimalView = useCallback((): void => {
      const stage = stageRef.current;
      if (!stage) return;

      stage.scale({ x: optimalScale, y: optimalScale });
      stage.position({ x: optimalPositionX, y: optimalPositionY });
    }, []);

    const setFullscreenView = useCallback((): void => {
      const stage = stageRef.current;
      if (!stage) return;

      stage.scale({ x: fullscreenScale, y: fullscreenScale });
      stage.position({ x: fullscreenPositionX, y: fullscreenPositionY });
    }, []);

    const handleZoomIn = useCallback((): void => {
      const stage = stageRef.current;
      if (!stage) return;

      const currentScale = stage.scaleX();
      const newScale = Math.min(currentScale + zoomStep, maxZoom);
      stage.scale({ x: newScale, y: newScale });
    }, []);

    const handleZoomOut = useCallback((): void => {
      const stage = stageRef.current;
      if (!stage) return;

      const currentScale = stage.scaleX();
      const newScale = Math.max(currentScale - zoomStep, minZoom);
      stage.scale({ x: newScale, y: newScale });
    }, []);

    const handleSetDrawingMode = useCallback((mode: DrawingMode): void => {
      setDrawingMode(mode);
      setIsDrawing(false);
      setCurrentLine(null);
    }, []);

    const clearDrawing = useCallback((): void => {
      const newDrawingData: DrawingData = {
        lines: [],
        lastUpdated: Date.now(),
      };

      setLocalDrawingData(newDrawingData);

      if (onDrawingUpdate) {
        onDrawingUpdate(newDrawingData);
      }
    }, [onDrawingUpdate]);

    useImperativeHandle(ref, () => ({
      setOptimalView,
      setFullscreenView,
      zoomIn: handleZoomIn,
      zoomOut: handleZoomOut,
      setDrawingMode: handleSetDrawingMode,
      clearDrawing,
    }));

    // 繪圖事件處理
    const handleMouseDown = useCallback((): void => {
      if (drawingMode !== DrawingMode.DRAWING || !isEditMode) return;

      setIsDrawing(true);
      const stage = stageRef.current;
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const relativePos = transform.point(pos);

      const newLine: DrawingLine = {
        id: `drawing-${Date.now()}-${Math.random()}`,
        points: [relativePos.x, relativePos.y],
        strokeWidth: drawingStrokeWidth,
        stroke: drawingStrokeColor,
        timestamp: Date.now(),
      };

      setCurrentLine(newLine);
    }, [drawingMode, isEditMode]);

    const handleMouseMove = useCallback((): void => {
      if (drawingMode !== DrawingMode.DRAWING || !isDrawing || !currentLine) return;

      const stage = stageRef.current;
      if (!stage) return;

      const pos = stage.getPointerPosition();
      if (!pos) return;

      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const relativePos = transform.point(pos);

      const updatedLine: DrawingLine = {
        ...currentLine,
        points: [...currentLine.points, relativePos.x, relativePos.y],
      };

      setCurrentLine(updatedLine);
    }, [drawingMode, isDrawing, currentLine]);

    const handleMouseUp = useCallback((): void => {
      if (drawingMode !== DrawingMode.DRAWING || !isDrawing || !currentLine) return;

      setIsDrawing(false);

      const newDrawingData: DrawingData = {
        lines: [...localDrawingData.lines, currentLine],
        lastUpdated: Date.now(),
      };

      setLocalDrawingData(newDrawingData);
      setCurrentLine(null);

      if (onDrawingUpdate) {
        onDrawingUpdate(newDrawingData);
      }
    }, [drawingMode, isDrawing, currentLine, localDrawingData, onDrawingUpdate]);

    const handleWheel = useCallback(
      (e: Konva.KonvaEventObject<WheelEvent>): void => {
        if (drawingMode === DrawingMode.DRAWING) return;

        e.evt.preventDefault();

        const stage: Konva.Stage | null = stageRef.current;
        if (!stage) return;

        const oldScale: number = stage.scaleX();
        const pointer: MousePoint = stage.getPointerPosition() || { x: 0, y: 0 };

        const mousePointTo: MousePoint = {
          x: (pointer.x - stage.x()) / oldScale,
          y: (pointer.y - stage.y()) / oldScale,
        };

        const direction: number = e.evt.deltaY > 0 ? -1 : 1;
        const scaleBy = 1.05;
        const newScale: number = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
        const clampedScale: number = Math.max(minZoom, Math.min(newScale, maxZoom));

        stage.scale({ x: clampedScale, y: clampedScale });

        const newPos: MousePoint = {
          x: pointer.x - mousePointTo.x * clampedScale,
          y: pointer.y - mousePointTo.y * clampedScale,
        };

        stage.position(newPos);
      },
      [drawingMode]
    );

    const generateSingleEliminationMatches = useCallback((playerList: Player[]): Match[] => {
      const matchList: Match[] = [];
      const totalRounds: number = Math.floor(Math.log2(playerList.length));

      for (let i = 0; i < playerList.length; i += 2) {
        matchList.push({
          id: `round1-match${i / 2}`,
          player1: playerList[i],
          player2: playerList[i + 1] || null,
          winner: null,
          round: 1,
          matchIndex: i / 2,
        });
      }

      for (let round = 2; round <= totalRounds; round++) {
        const prevRoundMatches: number = Math.pow(2, totalRounds - round + 1);
        const currentRoundMatches: number = prevRoundMatches / 2;

        for (let i = 0; i < currentRoundMatches; i++) {
          matchList.push({
            id: `round${round}-match${i}`,
            player1: null,
            player2: null,
            winner: null,
            round,
            matchIndex: i,
          });
        }
      }

      return matchList;
    }, []);

    const canMatchProceed = useCallback((match: Match): boolean => {
      return match.player1 !== null && match.player2 !== null;
    }, []);

    const clearPlayerFromFutureMatches = useCallback(
      (playerToClear: Player, fromRound: number, prevMatches: Match[]): Match[] => {
        return prevMatches.map((match: Match): Match => {
          if (match.round > fromRound) {
            const updatedMatch: Match = { ...match };

            if (updatedMatch.player1?.id === playerToClear.id) {
              updatedMatch.player1 = null;
            }
            if (updatedMatch.player2?.id === playerToClear.id) {
              updatedMatch.player2 = null;
            }

            if (updatedMatch.winner?.id === playerToClear.id) {
              updatedMatch.winner = null;
            }

            return updatedMatch;
          }
          return match;
        });
      },
      []
    );

    const advanceWinner = useCallback(
      (matchId: string, selectedPlayer: Player): void => {
        if (drawingMode === DrawingMode.DRAWING) return;
        if (!onMatchUpdate) return;

        const currentMatch: Match | undefined = matches.find((m: Match) => m.id === matchId);
        if (!currentMatch) return;

        if (currentMatch.round > 1 && !canMatchProceed(currentMatch)) {
          return;
        }

        if (currentMatch.winner?.id === selectedPlayer.id) {
          const updatedMatches: Match[] = matches.map(
            (match: Match): Match => (match.id === matchId ? { ...match, winner: null } : match)
          );
          const finalMatches: Match[] = clearPlayerFromFutureMatches(selectedPlayer, currentMatch.round, updatedMatches);
          onMatchUpdate(finalMatches);
          return;
        }

        let updatedMatches: Match[] = matches;
        if (currentMatch.winner) {
          updatedMatches = clearPlayerFromFutureMatches(currentMatch.winner, currentMatch.round, matches);
        }

        updatedMatches = updatedMatches.map(
          (match: Match): Match => (match.id === matchId ? { ...match, winner: selectedPlayer } : match)
        );

        if (currentMatch.round < Math.floor(Math.log2(players.length))) {
          const nextRound: number = currentMatch.round + 1;
          const nextMatchIndex: number = Math.floor(currentMatch.matchIndex / 2);
          const nextMatchId = `round${nextRound}-match${nextMatchIndex}`;
          const isFirstSlot: boolean = currentMatch.matchIndex % 2 === 0;

          updatedMatches = updatedMatches.map((match: Match): Match => {
            if (match.id === nextMatchId) {
              return {
                ...match,
                [isFirstSlot ? 'player1' : 'player2']: selectedPlayer,
              };
            }
            return match;
          });
        }
        onMatchUpdate(updatedMatches);
      },
      [matches, canMatchProceed, players.length, onMatchUpdate, clearPlayerFromFutureMatches, drawingMode]
    );

    const getRoundName = useCallback((roundNumber: number, totalRounds: number): string => {
      if (roundNumber === totalRounds) return '決賽';
      if (roundNumber === totalRounds - 1) return '準決賽';
      if (roundNumber === totalRounds - 2) return '八強賽';
      if (roundNumber === totalRounds - 3) return '十六強賽';
      return `第 ${roundNumber} 輪`;
    }, []);

    const matchPositions = useMemo((): PositionCache => {
      const positions: PositionCache = {};

      const calculatePosition = (round: number, matchIndex: number): Position => {
        const key = `${round}-${matchIndex}`;
        if (positions[key] !== undefined) {
          return positions[key];
        }

        if (round === 1) {
          const x: number = titleWidth + canvasLeftPadding + matchIndex * playerSpacing + boxHeight;
          const y: number = headerHeight + (rounds - 1) * roundHeight + canvasBottomPadding - boxHeight + boxHeight / 2;
          positions[key] = { x, y };
        } else {
          const prevMatch1Index: number = matchIndex * 2;
          const prevMatch2Index: number = matchIndex * 2 + 1;

          const prevMatch1Pos: Position = calculatePosition(round - 1, prevMatch1Index);
          const prevMatch2Pos: Position = calculatePosition(round - 1, prevMatch2Index);

          const x: number = (prevMatch1Pos.x + prevMatch2Pos.x) / 2;
          const y: number = headerHeight + (rounds - round) * roundHeight + canvasBottomPadding - boxHeight + boxHeight / 2;

          positions[key] = { x, y };
        }

        return positions[key];
      };

      for (let round = 1; round <= rounds; round++) {
        const roundMatches: number = Math.pow(2, rounds - round);
        for (let matchIndex = 0; matchIndex < roundMatches; matchIndex++) {
          calculatePosition(round, matchIndex);
        }
      }

      return positions;
    }, [rounds]);

    const getMatchPosition = useCallback(
      (round: number, matchIndex: number): Position => {
        return matchPositions[`${round}-${matchIndex}`] || { x: 0, y: 0 };
      },
      [matchPositions]
    );

    const champion = useMemo((): Player | null => {
      const finalMatch: Match | undefined = matches.find((match: Match) => match.round === rounds);
      return finalMatch?.winner || null;
    }, [matches, rounds]);

    const qrCodePosition = useMemo(() => {
      return {
        x: titleWidth + qrCodeOffsetX,
        y: qrCodeOffsetY,
      };
    }, []);

    const championPosition = useMemo(() => {
      const finalMatchPos = getMatchPosition(rounds, 0);
      return {
        x: finalMatchPos.x + (boxWidth - championBoxWidth) / 2,
        y: headerHeight + championTopMargin,
      };
    }, [getMatchPosition, rounds]);

    useEffect((): (() => void) => {
      updateStageSize();
      window.addEventListener('resize', updateStageSize);
      return (): void => {
        window.removeEventListener('resize', updateStageSize);
      };
    }, [updateStageSize]);

    useEffect(() => {
      const timer = setTimeout(() => {
        setOptimalView();
      }, 100);
      return () => clearTimeout(timer);
    }, [setOptimalView]);

    useEffect((): void => {
      if (matches.length === 0) {
        const initialMatches: Match[] = generateSingleEliminationMatches(players);
        if (onMatchUpdate) {
          onMatchUpdate(initialMatches);
        }
      }
    }, [generateSingleEliminationMatches, players, matches.length, onMatchUpdate]);

    return (
      <div ref={containerRef} className="w-full h-full relative">
        <Stage
          width={stageConfig.width}
          height={stageConfig.height}
          ref={stageRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          draggable={drawingMode === DrawingMode.NORMAL}
        >
          {/* 主要內容層 */}
          <Layer name={mainLayerName}>
            <QRCodeCanvas x={qrCodePosition.x} y={qrCodePosition.y} size={qrCodeSize} />

            {/* 輪次標題 */}
            {Array.from({ length: rounds }, (_, roundIndex: number) => {
              const roundNumber: number = roundIndex + 1;
              const titleY: number =
                headerHeight +
                (rounds - roundNumber) * roundHeight +
                canvasBottomPadding -
                boxHeight +
                boxHeight / 2 -
                titlePadding +
                roundHeight / 2;

              return (
                <Group key={`title-group-${roundNumber}`}>
                  <Rect
                    x={0}
                    y={titleY}
                    width={titleWidth}
                    height={headerHeight}
                    fill="rgba(255, 255, 255, 0.9)"
                    stroke={strokeColor}
                    strokeWidth={1}
                    cornerRadius={4}
                  />
                  <Text
                    x={titlePadding}
                    y={titleY + titlePadding}
                    text={getRoundName(roundNumber, rounds)}
                    fontSize={roundTitleFontSize}
                    fontFamily="Arial"
                    fontStyle="bold"
                    fill="#374151"
                    width={titleWidth - titlePadding * 2}
                    align="center"
                    verticalAlign="middle"
                    wrap="none"
                  />
                </Group>
              );
            })}

            {/* 冠軍標題 */}
            <Group>
              <Rect
                x={0}
                y={0}
                width={titleWidth}
                height={headerHeight}
                fill="rgba(255, 215, 0, 0.2)"
                stroke={highlightColor}
                strokeWidth={championStrokeWidth - 1}
                cornerRadius={4}
              />
              <Text
                x={titlePadding}
                y={titlePadding}
                text="🏆 冠軍"
                fontSize={roundTitleFontSize}
                fontFamily="Arial"
                fontStyle="bold"
                fill={highlightColor}
                width={titleWidth - titlePadding * 2}
                align="center"
                verticalAlign="middle"
                wrap="none"
              />
            </Group>

            {/* 比賽框 */}
            {matches.map((match: Match) => {
              const pos: Position = getMatchPosition(match.round, match.matchIndex);
              return (
                <KonvaMatch
                  key={match.id}
                  match={match}
                  x={pos.x}
                  y={pos.y + championToFinalGap}
                  onPlayerClick={advanceWinner}
                  isEditMode={isEditMode && drawingMode === DrawingMode.NORMAL}
                />
              );
            })}

            {/* 從決賽到冠軍的連接線 */}
            {champion && (
              <Line
                points={[
                  getMatchPosition(rounds, 0).x + boxWidth / 2,
                  getMatchPosition(rounds, 0).y + championToFinalGap,
                  getMatchPosition(rounds, 0).x + boxWidth / 2,
                  championPosition.y,
                ]}
                stroke={connectionLineColor}
                strokeWidth={championConnectionLineWidth}
              />
            )}

            {/* 冠軍框 */}
            {champion && (
              <Group>
                <Rect
                  x={championPosition.x}
                  y={0}
                  width={championBoxWidth}
                  height={championBoxHeight}
                  fill={championBackgroundColor}
                  stroke={highlightColor}
                  strokeWidth={championStrokeWidth}
                  cornerRadius={4}
                />
                <Text
                  x={championPosition.x + championTextPaddingX}
                  y={(championBoxHeight - championNameFontSize) / 2}
                  text={champion.name}
                  fontSize={championNameFontSize}
                  fontFamily="Arial"
                  fontStyle="bold"
                  fill={textColor}
                  width={championTextWidth}
                  ellipsis
                  wrap="none"
                  align="center"
                  verticalAlign="middle"
                />
                <Text
                  x={championPosition.x + championBoxWidth - crownIconOffsetX}
                  y={(championBoxHeight - crownIconFontSize) / 2}
                  text="👑"
                  fontSize={crownIconFontSize}
                />
              </Group>
            )}

            {/* 連接線 */}
            {Array.from({ length: rounds - 1 }, (_, roundIndex: number) => {
              const currentRound: number = roundIndex + 1;
              const nextRound: number = currentRound + 1;
              const nextRoundMatches: Match[] = matches.filter((m: Match) => m.round === nextRound);

              return nextRoundMatches
                .map((nextMatch: Match) => {
                  const firstMatchIndex: number = nextMatch.matchIndex * 2;
                  const secondMatchIndex: number = nextMatch.matchIndex * 2 + 1;

                  const firstMatch: Match | undefined = matches.find(
                    (m: Match) => m.round === currentRound && m.matchIndex === firstMatchIndex
                  );
                  const secondMatch: Match | undefined = matches.find(
                    (m: Match) => m.round === currentRound && m.matchIndex === secondMatchIndex
                  );

                  if (!firstMatch?.winner || !secondMatch?.winner) return null;

                  const firstPos: Position = getMatchPosition(currentRound, firstMatchIndex);
                  const secondPos: Position = getMatchPosition(currentRound, secondMatchIndex);
                  const nextPos: Position = getMatchPosition(nextRound, nextMatch.matchIndex);

                  const firstMatchCenterX: number = firstPos.x + boxWidth / 2;
                  const firstMatchTopY: number = firstPos.y + championToFinalGap;
                  const secondMatchCenterX: number = secondPos.x + boxWidth / 2;
                  const secondMatchTopY: number = secondPos.y + championToFinalGap;
                  const nextMatchCenterX: number = nextPos.x + boxWidth / 2;
                  const nextMatchBottomY: number = nextPos.y + boxHeight + championToFinalGap;
                  const midY: number = (firstMatchTopY + nextMatchBottomY) / 2;

                  return (
                    <Group key={`connector-group-${currentRound}-${nextMatch.matchIndex}`}>
                      <Line
                        points={[firstMatchCenterX, firstMatchTopY, firstMatchCenterX, midY]}
                        stroke={connectionLineColor}
                        strokeWidth={connectionLineWidth}
                      />
                      <Line
                        points={[secondMatchCenterX, secondMatchTopY, secondMatchCenterX, midY]}
                        stroke={connectionLineColor}
                        strokeWidth={connectionLineWidth}
                      />
                      <Line
                        points={[firstMatchCenterX, midY, secondMatchCenterX, midY]}
                        stroke={connectionLineColor}
                        strokeWidth={connectionLineWidth}
                      />
                      <Line
                        points={[nextMatchCenterX, midY, nextMatchCenterX, nextMatchBottomY]}
                        stroke={connectionLineColor}
                        strokeWidth={connectionLineWidth}
                      />
                    </Group>
                  );
                })
                .filter((item): item is JSX.Element => item !== null);
            }).flat()}
          </Layer>

          {/* 繪圖層 - 關鍵修正！ */}
          <Layer ref={drawingLayerRef} listening={false}>
            {/* 測試線條 - 用於驗證繪圖層是否工作 */}
            {/* <Line
              points={[50, 50, 200, 200]}
              stroke="#ff0000"
              strokeWidth={3}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            /> */}

            {/* 強化的調試信息 */}

            {/* 已完成的繪圖線條 */}
            {localDrawingData.lines.map((line: DrawingLine, index: number) => {
              // 驗證線條數據有效性
              if (!line.points || line.points.length < 4) {
                console.warn(`⚠️ [RENDER] 線條 ${index} 數據無效:`, line);
                return null;
              }

              return (
                <Line
                  key={line.id}
                  points={line.points}
                  stroke={line.stroke}
                  strokeWidth={line.strokeWidth}
                  tension={0.5}
                  lineCap={drawingLineCap}
                  lineJoin={drawingLineJoin}
                  globalCompositeOperation="source-over"
                />
              );
            })}

            {/* 當前正在繪製的線條 */}
            {currentLine && (
              <Line
                points={currentLine.points}
                stroke={currentLine.stroke}
                strokeWidth={currentLine.strokeWidth}
                tension={0.5}
                lineCap={drawingLineCap}
                lineJoin={drawingLineJoin}
                globalCompositeOperation="source-over"
              />
            )}
          </Layer>
        </Stage>

        {/* 繪圖模式指示器 */}
        {drawingMode === DrawingMode.DRAWING && (
          <div className="absolute top-4 left-4 z-10 bg-red-100 border border-red-300 rounded-lg px-3 py-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-700 text-sm font-medium">繪圖模式</span>
            </div>
          </div>
        )}

        {/* 調試信息顯示 */}
        <div className="absolute bottom-4 left-4 z-10 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
          <div>本地線條: {localDrawingData.lines.length}</div>
          <div>外部線條: {drawingData?.lines?.length || 0}</div>
        </div>
      </div>
    );
  }
);

SingleEliminationKonva.displayName = 'SingleEliminationKonva';

export default SingleEliminationKonva;
