'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  headerHeight,
  playerSpacing,
  roundHeight,
  titlePadding,
  titleWidth,
} from './constants';
import { SingleEliminationKonvaProps } from './interfaces';
import KonvaMatch from './KonvaMatch';

// 導入 QRCodeCanvas 組件

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

const SingleEliminationKonva: React.FC<SingleEliminationKonvaProps> = ({ players, matches, isEditMode, onMatchUpdate }) => {
  const rounds = Math.floor(Math.log2(players.length));
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 定義虛擬場景尺寸 - 這是我們內容的實際大小
  const firstRoundMatches = players.length / 2;
  const matchesAreaWidth = firstRoundMatches * playerSpacing;
  // 移除額外的 QR code 空間，因為現在放在左上角
  const sceneWidth = titleWidth + canvasLeftPadding + matchesAreaWidth + canvasRightPadding;
  const sceneHeight = rounds * roundHeight + headerHeight + boxHeight + canvasBottomPadding + 40;

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

    // 計算適合的縮放比例
    const scaleX: number = containerWidth / sceneWidth;
    const scaleY: number = containerHeight / sceneHeight;
    const scale: number = Math.min(scaleX, scaleY, 1); // 不要超過 100%

    setStageConfig({
      width: containerWidth,
      height: containerHeight,
      scale,
    });
  }, [sceneWidth, sceneHeight]);

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
    const clampedScale: number = Math.max(0.1, Math.min(newScale, 3));

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
      x: titleWidth + boxWidth,
      y: boxWidth / 5,
    };
  }, []);

  // 響應式更新
  useEffect((): (() => void) => {
    updateStageSize();
    window.addEventListener('resize', updateStageSize);

    return (): void => {
      window.removeEventListener('resize', updateStageSize);
    };
  }, [updateStageSize]);

  useEffect((): void => {
    if (matches.length === 0) {
      const initialMatches: Match[] = generateSingleEliminationMatches(players);
      if (onMatchUpdate) {
        onMatchUpdate(initialMatches);
      }
    }
  }, [generateSingleEliminationMatches, players, matches.length, onMatchUpdate]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <Stage width={stageConfig.width} height={stageConfig.height} ref={stageRef} onWheel={handleWheel} draggable>
        <Layer>
          {/* QR Code - 放在最上層 */}
          <QRCodeCanvas x={qrCodePosition.x} y={qrCodePosition.y} size={80} />

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
              20;

            return (
              <Group key={`title-group-${roundNumber}`}>
                <Rect
                  x={0}
                  y={titleY - titlePadding}
                  width={titleWidth}
                  height={titlePadding * 2}
                  fill="rgba(255, 255, 255, 0.9)"
                  stroke="#e5e7eb"
                  strokeWidth={1}
                  cornerRadius={4}
                />
                <Text
                  x={titlePadding}
                  y={titleY - titlePadding / 2}
                  text={getRoundName(roundNumber, rounds)}
                  fontSize={12}
                  fontFamily="Arial"
                  fontStyle="bold"
                  fill="#374151"
                  width={titleWidth - titlePadding * 2}
                  align="center"
                  verticalAlign="middle"
                />
              </Group>
            );
          })}

          {/* 冠軍標題 */}
          <Group>
            <Rect
              x={0}
              y={headerHeight - titlePadding * 3}
              width={titleWidth}
              height={titlePadding * 3}
              fill="rgba(255, 215, 0, 0.2)"
              stroke="#f97316"
              strokeWidth={2}
              cornerRadius={4}
            />
            <Text
              x={titlePadding}
              y={headerHeight - titlePadding * 2}
              text="🏆 冠軍"
              fontSize={14}
              fontFamily="Arial"
              fontStyle="bold"
              fill="#f97316"
              width={titleWidth - titlePadding * 2}
              align="center"
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
                y={pos.y}
                onPlayerClick={advanceWinner}
                isEditMode={isEditMode}
              />
            );
          })}

          {/* 冠軍框 */}
          {champion && (
            <Group>
              <Rect
                x={getMatchPosition(rounds, 0).x}
                y={headerHeight - 30}
                width={boxWidth}
                height={boxHeight}
                fill="#ffd700"
                stroke="#f97316"
                strokeWidth={3}
                cornerRadius={4}
              />
              <Text
                x={getMatchPosition(rounds, 0).x + titlePadding}
                y={headerHeight - 30 + (boxHeight - 14) / 2}
                text={champion.name}
                fontSize={14}
                fontFamily="Arial"
                fontStyle="bold"
                fill="#000000"
                width={boxWidth - titlePadding * 3}
                ellipsis
                wrap="none"
              />
              <Text
                x={getMatchPosition(rounds, 0).x + boxWidth - titlePadding * 2.5}
                y={headerHeight - 30 + (boxHeight - 16) / 2}
                text="👑"
                fontSize={16}
              />
            </Group>
          )}

          {/* 從決賽到冠軍的連接線 */}
          {champion && (
            <Line
              points={[
                getMatchPosition(rounds, 0).x + boxWidth / 2,
                getMatchPosition(rounds, 0).y,
                getMatchPosition(rounds, 0).x + boxWidth / 2,
                headerHeight - 30 + boxHeight,
              ]}
              stroke="#f97316"
              strokeWidth={3}
            />
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
                const firstMatchTopY: number = firstPos.y;

                const secondMatchCenterX: number = secondPos.x + boxWidth / 2;
                const secondMatchTopY: number = secondPos.y;

                const nextMatchCenterX: number = nextPos.x + boxWidth / 2;
                const nextMatchBottomY: number = nextPos.y + boxHeight;

                const midY: number = (firstMatchTopY + nextMatchBottomY) / 2;

                return (
                  <Group key={`connector-group-${currentRound}-${nextMatch.matchIndex}`}>
                    <Line
                      points={[firstMatchCenterX, firstMatchTopY, firstMatchCenterX, midY]}
                      stroke="#f97316"
                      strokeWidth={2}
                    />
                    <Line
                      points={[secondMatchCenterX, secondMatchTopY, secondMatchCenterX, midY]}
                      stroke="#f97316"
                      strokeWidth={2}
                    />
                    <Line points={[firstMatchCenterX, midY, secondMatchCenterX, midY]} stroke="#f97316" strokeWidth={2} />
                    <Line
                      points={[nextMatchCenterX, midY, nextMatchCenterX, nextMatchBottomY]}
                      stroke="#f97316"
                      strokeWidth={2}
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
};

export default SingleEliminationKonva;
