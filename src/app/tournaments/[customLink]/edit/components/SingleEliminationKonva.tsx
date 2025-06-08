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

  // 計算精確的畫布尺寸 - 精確計算冠軍框所需空間
  const canvasWidth = rounds * roundWidth + boxWidth + 60; // 只需要boxWidth + 一些連接線和padding空間
  const canvasHeight = Math.max(600, players.length * 40 + headerHeight + 100);

  const generateSingleEliminationMatches = useCallback((playerList: Player[]): Match[] => {
    const matchList: Match[] = [];
    const totalRounds = Math.floor(Math.log2(playerList.length));

    // 第一輪 - 直接分配選手
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

    // 後續輪次
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

  // 檢查比賽是否可以進行（兩個選手都存在）
  const canMatchProceed = useCallback((match: Match): boolean => {
    return match.player1 !== null && match.player2 !== null;
  }, []);

  // 清除後續比賽中的該選手
  const clearPlayerFromFutureMatches = useCallback(
    (playerToClear: Player, fromRound: number, prevMatches: Match[]): Match[] => {
      return prevMatches.map((match) => {
        if (match.round > fromRound) {
          const updatedMatch = { ...match };

          // 清除該選手
          if (updatedMatch.player1?.id === playerToClear.id) {
            updatedMatch.player1 = null;
          }
          if (updatedMatch.player2?.id === playerToClear.id) {
            updatedMatch.player2 = null;
          }

          // 如果獲勝者是該選手，也要清除
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

      // 防呆措施1: 檢查比賽是否可以進行（除了第一輪）
      if (currentMatch.round > 1 && !canMatchProceed(currentMatch)) {
        // console.log('比賽無法進行：缺少對手');
        return matches; // 不允許選擇，直接返回
      }

      // 防呆措施2: 如果點擊的是當前獲勝者，則取消選擇
      if (currentMatch.winner?.id === selectedPlayer.id) {
        // 取消當前比賽的獲勝者
        const updatedMatches = matches.map((match) => (match.id === matchId ? { ...match, winner: null } : match));

        // 清除該選手在後續比賽中的所有出現
        return clearPlayerFromFutureMatches(selectedPlayer, currentMatch.round, updatedMatches);
      }

      // 如果之前有獲勝者，先清除該獲勝者在後續比賽中的出現
      let updatedMatches = matches;
      if (currentMatch.winner) {
        updatedMatches = clearPlayerFromFutureMatches(currentMatch.winner, currentMatch.round, matches);
      }

      // 設置新的獲勝者
      updatedMatches = updatedMatches.map((match) => (match.id === matchId ? { ...match, winner: selectedPlayer } : match));

      // 推進獲勝者到下一輪
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

  // 獲取輪次名稱
  const getRoundName = useCallback((roundNumber: number, totalRounds: number): string => {
    if (roundNumber === totalRounds) return '決賽';
    if (roundNumber === totalRounds - 1) return '準決賽';
    if (roundNumber === totalRounds - 2) return '八強賽';
    if (roundNumber === totalRounds - 3) return '十六強賽';
    return `第 ${roundNumber} 輪`;
  }, []);

  // 計算比賽框的Y位置
  const matchPositions = useMemo(() => {
    const positions: { [key: string]: number } = {};

    const calculatePosition = (round: number, matchIndex: number): number => {
      const key = `${round}-${matchIndex}`;
      if (positions[key] !== undefined) {
        return positions[key];
      }

      if (round === 1) {
        // 第一輪：平均分布
        const firstRoundMatches = players.length / 2;
        const availableHeight = canvasHeight - headerHeight - 100; // 減少邊距
        const spacing = availableHeight / firstRoundMatches;
        const startY = headerHeight + 50; // 減少起始Y位置
        positions[key] = startY + matchIndex * spacing;
      } else {
        // 後續輪次：對準前一輪兩個比賽的中間
        const prevMatch1Index = matchIndex * 2;
        const prevMatch2Index = matchIndex * 2 + 1;

        const prevMatch1Y = calculatePosition(round - 1, prevMatch1Index);
        const prevMatch2Y = calculatePosition(round - 1, prevMatch2Index);

        // 計算兩個前一輪比賽框的中心點
        const match1Center = prevMatch1Y + matchHeight / 2;
        const match2Center = prevMatch2Y + matchHeight / 2;
        const centerY = (match1Center + match2Center) / 2;

        // 讓當前比賽框的中心對齊這個中心點
        positions[key] = centerY - matchHeight / 2;
      }

      return positions[key];
    };

    // 預先計算所有位置
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

  // 獲取冠軍
  const champion = useMemo(() => {
    const finalMatch = matches.find((match) => match.round === rounds);
    return finalMatch?.winner || null;
  }, [matches, rounds]);

  useEffect(() => {
    // 只有當沒有比賽資料時才生成新的比賽
    if (matches.length === 0) {
      const initialMatches = generateSingleEliminationMatches(players);
      !!onMatchUpdate && onMatchUpdate(initialMatches);
    }
  }, [generateSingleEliminationMatches, players, matches.length, onMatchUpdate]);

  return (
    // 修正 RWD：確保可以水平滾動，完整顯示所有內容
    <div className="w-full">
      <div
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          minWidth: `${canvasWidth}px`, // 確保最小寬度
        }}
      >
        <Stage width={canvasWidth} height={canvasHeight}>
          <Layer>
            {/* 輪次標題 */}
            {Array.from({ length: rounds }, (_, roundIndex) => {
              const roundNumber = roundIndex + 1;
              const x = roundIndex * roundWidth + 20; // 添加左側padding

              return (
                <Text
                  key={`title-${roundNumber}`}
                  x={x}
                  y={20}
                  text={getRoundName(roundNumber, rounds)}
                  fontSize={16} // 稍微縮小字體
                  fontFamily="Arial"
                  fontStyle="bold"
                  fill="#374151"
                  width={boxWidth}
                  align="center"
                />
              );
            })}

            {/* 冠軍標題 */}
            <Text
              x={rounds * roundWidth + 20}
              y={20}
              text="冠軍"
              fontSize={16}
              fontFamily="Arial"
              fontStyle="bold"
              fill="#374151"
              width={boxWidth}
              align="center"
            />

            {/* 比賽框 */}
            {matches.map((match) => {
              const roundIndex = match.round - 1;
              const x = roundIndex * roundWidth + 20; // 添加左側padding
              const y = getMatchY(match.round, match.matchIndex);

              return <KonvaMatch key={match.id} match={match} x={x} y={y} onPlayerClick={advanceWinner} />;
            })}

            {/* 冠軍框 */}
            {champion && (
              <Group>
                <Rect
                  x={rounds * roundWidth + 20}
                  y={getMatchY(rounds, 0) + boxHeight / 2} // 與決賽框垂直居中對齊
                  width={boxWidth}
                  height={boxHeight}
                  fill="#ffd700" // 金色背景代表冠軍
                  stroke="#f97316"
                  strokeWidth={3}
                />
                <Text
                  x={rounds * roundWidth + 20 + 8}
                  y={getMatchY(rounds, 0) + boxHeight / 2 + 10}
                  text={champion.name}
                  fontSize={14}
                  fontFamily="Arial"
                  fontStyle="bold"
                  fill="#000000"
                  width={boxWidth - 16}
                  ellipsis
                  wrap="none"
                />
                {/* 冠軍圖標 */}
                <Text
                  x={rounds * roundWidth + 20 + boxWidth - 20}
                  y={getMatchY(rounds, 0) + boxHeight / 2 + 8}
                  text="👑"
                  fontSize={16}
                />
              </Group>
            )}

            {/* 從決賽到冠軍的連接線 */}
            {champion && (
              <Line
                points={[
                  (rounds - 1) * roundWidth + 20 + boxWidth, // 決賽右邊
                  getMatchY(rounds, 0) + boxHeight, // 決賽中心Y
                  rounds * roundWidth + 20, // 冠軍框左邊
                  getMatchY(rounds, 0) + boxHeight / 2 + boxHeight / 2, // 冠軍框中心Y
                ]}
                stroke="#f97316"
                strokeWidth={3}
              />
            )}

            {/* 連接線 */}
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

                  // 調整連接線座標
                  const fromX = (currentRound - 1) * roundWidth + 20 + boxWidth;
                  const toX = (nextRound - 1) * roundWidth + 20;

                  const firstMatchY = getMatchY(currentRound, firstMatchIndex) + boxHeight;
                  const secondMatchY = getMatchY(currentRound, secondMatchIndex) + boxHeight;
                  const toY = getMatchY(nextRound, nextMatch.matchIndex) + boxHeight;

                  const midX = fromX + 10; // 縮短連接線長度

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
