'use client';

import React, { useCallback, useEffect, useMemo } from 'react';

import { Group, Layer, Line, Rect, Stage, Text } from 'react-konva';

import { Match, Player } from '@/domains/tournament';

import { boxHeight, boxWidth, headerHeight, matchHeight, roundWidth } from './constants';
import { SingleEliminationKonvaProps } from './interfaces';
import KonvaConnector from './KonvaConnector';
import KonvaMatch from './KonvaMatch';

const SingleEliminationKonva: React.FC<SingleEliminationKonvaProps> = ({ players, matches, onMatchUpdate }) => {
  const rounds = Math.floor(Math.log2(players.length));

  const canvasWidth = rounds * roundWidth + boxWidth + 35;
  const canvasHeight = Math.max(320, players.length * 28 + headerHeight + 40);

  const generateSingleEliminationMatches = useCallback((playerList: Player[]): Match[] => {
    const matchList: Match[] = [];
    const totalRounds = Math.floor(Math.log2(playerList.length));

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
      const prevRoundMatches = Math.pow(2, totalRounds - round + 1);
      const currentRoundMatches = prevRoundMatches / 2;

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
      return prevMatches.map((match) => {
        if (match.round > fromRound) {
          const updatedMatch = { ...match };

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
    (matchId: string, selectedPlayer: Player) => {
      if (!onMatchUpdate) return;

      const currentMatch = matches.find((m) => m.id === matchId);
      if (!currentMatch) return matches;

      if (currentMatch.round > 1 && !canMatchProceed(currentMatch)) {
        return matches;
      }

      if (currentMatch.winner?.id === selectedPlayer.id) {
        const updatedMatches = matches.map((match) => (match.id === matchId ? { ...match, winner: null } : match));
        return clearPlayerFromFutureMatches(selectedPlayer, currentMatch.round, updatedMatches);
      }

      let updatedMatches = matches;
      if (currentMatch.winner) {
        updatedMatches = clearPlayerFromFutureMatches(currentMatch.winner, currentMatch.round, matches);
      }

      updatedMatches = updatedMatches.map((match) => (match.id === matchId ? { ...match, winner: selectedPlayer } : match));

      if (currentMatch.round < Math.floor(Math.log2(players.length))) {
        const nextRound = currentMatch.round + 1;
        const nextMatchIndex = Math.floor(currentMatch.matchIndex / 2);
        const nextMatchId = `round${nextRound}-match${nextMatchIndex}`;
        const isFirstSlot = currentMatch.matchIndex % 2 === 0;

        updatedMatches = updatedMatches.map((match) => {
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

  const matchPositions = useMemo(() => {
    const positions: { [key: string]: number } = {};

    const calculatePosition = (round: number, matchIndex: number): number => {
      const key = `${round}-${matchIndex}`;
      if (positions[key] !== undefined) {
        return positions[key];
      }

      if (round === 1) {
        const firstRoundMatches = players.length / 2;
        const availableHeight = canvasHeight - headerHeight - 40;
        const spacing = availableHeight / firstRoundMatches;
        const startY = headerHeight + 20;
        positions[key] = startY + matchIndex * spacing;
      } else {
        const prevMatch1Index = matchIndex * 2;
        const prevMatch2Index = matchIndex * 2 + 1;

        const prevMatch1Y = calculatePosition(round - 1, prevMatch1Index);
        const prevMatch2Y = calculatePosition(round - 1, prevMatch2Index);

        const match1Center = prevMatch1Y + matchHeight / 2;
        const match2Center = prevMatch2Y + matchHeight / 2;
        const centerY = (match1Center + match2Center) / 2;

        positions[key] = centerY - matchHeight / 2;
      }

      return positions[key];
    };

    for (let round = 1; round <= rounds; round++) {
      const roundMatches = Math.pow(2, rounds - round);
      for (let matchIndex = 0; matchIndex < roundMatches; matchIndex++) {
        calculatePosition(round, matchIndex);
      }
    }

    return positions;
  }, [players.length, rounds, canvasHeight]);

  const getMatchY = useCallback(
    (round: number, matchIndex: number): number => {
      return matchPositions[`${round}-${matchIndex}`] || 0;
    },
    [matchPositions]
  );

  const champion = useMemo(() => {
    const finalMatch = matches.find((match) => match.round === rounds);
    return finalMatch?.winner || null;
  }, [matches, rounds]);

  useEffect(() => {
    if (matches.length === 0) {
      const initialMatches = generateSingleEliminationMatches(players);
      !!onMatchUpdate && onMatchUpdate(initialMatches);
    }
  }, [generateSingleEliminationMatches, players, matches.length, onMatchUpdate]);

  return (
    <div className="w-full">
      <div
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          minWidth: `${canvasWidth}px`,
        }}
      >
        <Stage width={canvasWidth} height={canvasHeight}>
          <Layer>
            {Array.from({ length: rounds }, (_, roundIndex) => {
              const roundNumber = roundIndex + 1;
              const x = roundIndex * roundWidth + 15;

              return (
                <Text
                  key={`title-${roundNumber}`}
                  x={x}
                  y={8}
                  text={getRoundName(roundNumber, rounds)}
                  fontSize={11}
                  fontFamily="Arial"
                  fontStyle="bold"
                  fill="#374151"
                  width={boxWidth}
                  align="center"
                />
              );
            })}

            <Text
              x={rounds * roundWidth + 15}
              y={8}
              text="冠軍"
              fontSize={11}
              fontFamily="Arial"
              fontStyle="bold"
              fill="#374151"
              width={boxWidth}
              align="center"
            />

            {matches.map((match) => {
              const roundIndex = match.round - 1;
              const x = roundIndex * roundWidth + 15;
              const y = getMatchY(match.round, match.matchIndex);

              return <KonvaMatch key={match.id} match={match} x={x} y={y} onPlayerClick={advanceWinner} />;
            })}

            {champion && (
              <Group>
                <Rect
                  x={rounds * roundWidth + 15}
                  y={getMatchY(rounds, 0) + boxHeight / 2}
                  width={boxWidth}
                  height={boxHeight}
                  fill="#ffd700"
                  stroke="#f97316"
                  strokeWidth={2}
                />
                <Text
                  x={rounds * roundWidth + 15 + 3}
                  y={getMatchY(rounds, 0) + boxHeight / 2 + (boxHeight - 9) / 2}
                  text={champion.name}
                  fontSize={9}
                  fontFamily="Arial"
                  fontStyle="bold"
                  fill="#000000"
                  width={boxWidth - 14}
                  ellipsis
                  wrap="none"
                />
                <Text
                  x={rounds * roundWidth + 15 + boxWidth - 12}
                  y={getMatchY(rounds, 0) + boxHeight / 2 + (boxHeight - 10) / 2}
                  text="👑"
                  fontSize={10}
                />
              </Group>
            )}

            {champion && (
              <Line
                points={[
                  (rounds - 1) * roundWidth + 15 + boxWidth,
                  getMatchY(rounds, 0) + boxHeight,
                  rounds * roundWidth + 15,
                  getMatchY(rounds, 0) + boxHeight / 2 + boxHeight / 2,
                ]}
                stroke="#f97316"
                strokeWidth={2}
              />
            )}

            {Array.from({ length: rounds - 1 }, (_, roundIndex) => {
              const currentRound = roundIndex + 1;
              const nextRound = currentRound + 1;

              const nextRoundMatches = matches.filter((m) => m.round === nextRound);

              return nextRoundMatches
                .map((nextMatch) => {
                  const firstMatchIndex = nextMatch.matchIndex * 2;
                  const secondMatchIndex = nextMatch.matchIndex * 2 + 1;

                  const firstMatch = matches.find((m) => m.round === currentRound && m.matchIndex === firstMatchIndex);
                  const secondMatch = matches.find((m) => m.round === currentRound && m.matchIndex === secondMatchIndex);

                  if (!firstMatch?.winner && !secondMatch?.winner) return null;

                  const fromX = (currentRound - 1) * roundWidth + 15 + boxWidth;
                  const toX = (nextRound - 1) * roundWidth + 15;

                  const firstMatchY = getMatchY(currentRound, firstMatchIndex) + boxHeight;
                  const secondMatchY = getMatchY(currentRound, secondMatchIndex) + boxHeight;
                  const toY = getMatchY(nextRound, nextMatch.matchIndex) + boxHeight;

                  const midX = fromX + 6;

                  if (firstMatch?.winner && secondMatch?.winner) {
                    return (
                      <Group key={`connector-group-${currentRound}-${nextMatch.matchIndex}`}>
                        <Line points={[fromX, firstMatchY, midX, firstMatchY]} stroke="#f97316" strokeWidth={2} />
                        <Line points={[fromX, secondMatchY, midX, secondMatchY]} stroke="#f97316" strokeWidth={2} />
                        <Line points={[midX, firstMatchY, midX, secondMatchY]} stroke="#f97316" strokeWidth={2} />
                        <Line points={[midX, toY, toX, toY]} stroke="#f97316" strokeWidth={2} />
                      </Group>
                    );
                  }

                  if (firstMatch?.winner) {
                    return (
                      <KonvaConnector
                        key={`connector-single-${firstMatch.id}`}
                        fromX={fromX}
                        fromY={firstMatchY}
                        toX={toX}
                        toY={toY}
                      />
                    );
                  }

                  if (secondMatch?.winner) {
                    return (
                      <KonvaConnector
                        key={`connector-single-${secondMatch.id}`}
                        fromX={fromX}
                        fromY={secondMatchY}
                        toX={toX}
                        toY={toY}
                      />
                    );
                  }

                  return null;
                })
                .filter(Boolean);
            }).flat()}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default SingleEliminationKonva;
