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
  fullscreenPositionX,
  fullscreenPositionY,
  fullscreenScale,
  headerHeight,
  highlightColor,
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
import { SingleEliminationKonvaProps } from './interfaces';
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

// 導出控制方法的接口
export interface SingleEliminationKonvaRef {
  setOptimalView: () => void;
  setFullscreenView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

const SingleEliminationKonva = forwardRef<SingleEliminationKonvaRef, SingleEliminationKonvaProps>(
  ({ players, matches, isEditMode, onMatchUpdate }, ref) => {
    const rounds = Math.floor(Math.log2(players.length));
    const stageRef = useRef<Konva.Stage>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // 定義虛擬場景尺寸 - 這是我們內容的實際大小
    const firstRoundMatches = players.length / 2;
    const matchesAreaWidth = firstRoundMatches * playerSpacing;
    const sceneWidth = titleWidth + canvasLeftPadding + matchesAreaWidth + canvasRightPadding;
    const sceneHeight = rounds * roundHeight + headerHeight + boxHeight + canvasBottomPadding + sceneHeightExtra;

    // 追蹤當前的縮放和尺寸
    const [stageConfig, setStageConfig] = useState<StageConfig>({
      width: sceneWidth,
      height: sceneHeight,
      scale: 1,
    });

    // 處理容器大小變化
    const updateStageSize = useCallback((): void => {
      if (!containerRef.current) return;

      const containerWidth: number = containerRef.current.offsetWidth;
      const containerHeight: number = containerRef.current.offsetHeight;

      setStageConfig({
        width: containerWidth,
        height: containerHeight,
        scale: 1, // 這裡先設定為 1，實際縮放在 Stage 組件中設定
      });
    }, []);

    // 設定最佳的初始縮放和位置
    const setOptimalView = useCallback((): void => {
      const stage = stageRef.current;
      if (!stage) return;

      // 設定最佳縮放
      stage.scale({ x: optimalScale, y: optimalScale });

      // 設定最佳位置
      stage.position({ x: optimalPositionX, y: optimalPositionY });
    }, []);

    // 設定全螢幕視角
    const setFullscreenView = useCallback((): void => {
      const stage = stageRef.current;
      if (!stage) return;

      // 設定全螢幕縮放
      stage.scale({ x: fullscreenScale, y: fullscreenScale });

      // 設定全螢幕位置
      stage.position({ x: fullscreenPositionX, y: fullscreenPositionY });
    }, []);

    // 縮放控制
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

    // 暴露方法給父組件
    useImperativeHandle(ref, () => ({
      setOptimalView,
      setFullscreenView,
      zoomIn: handleZoomIn,
      zoomOut: handleZoomOut,
    }));

    // 處理滾輪縮放
    const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>): void => {
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

      // 限制縮放範圍
      const clampedScale: number = Math.max(minZoom, Math.min(newScale, maxZoom));

      stage.scale({ x: clampedScale, y: clampedScale });

      const newPos: MousePoint = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      };

      stage.position(newPos);
    }, []);

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
      [matches, canMatchProceed, players.length, onMatchUpdate, clearPlayerFromFutureMatches]
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

    // 計算冠軍框的位置
    const championPosition = useMemo(() => {
      const finalMatchPos = getMatchPosition(rounds, 0);
      return {
        x: finalMatchPos.x + (boxWidth - championBoxWidth) / 2, // 置中對齊決賽框
        y: headerHeight + championTopMargin, // 在冠軍標題下方
      };
    }, [getMatchPosition, rounds]);

    // 響應式更新
    useEffect((): (() => void) => {
      updateStageSize();
      window.addEventListener('resize', updateStageSize);

      return (): void => {
        window.removeEventListener('resize', updateStageSize);
      };
    }, [updateStageSize]);

    // 設定初始最佳視角
    useEffect(() => {
      // 延遲一點時間確保 Stage 已經完全渲染
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
        <Stage width={stageConfig.width} height={stageConfig.height} ref={stageRef} onWheel={handleWheel} draggable>
          <Layer>
            {/* QR Code - 放在最上層 */}
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
                  isEditMode={isEditMode}
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
        </Stage>
      </div>
    );
  }
);

SingleEliminationKonva.displayName = 'SingleEliminationKonva';

export default SingleEliminationKonva;
