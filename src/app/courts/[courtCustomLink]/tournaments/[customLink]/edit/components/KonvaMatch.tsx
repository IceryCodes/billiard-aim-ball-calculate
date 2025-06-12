'use client';

import React, { useCallback } from 'react';

import { Group, Line, Rect, Text } from 'react-konva';

import { Player } from '@/domains/tournament';

import {
  boxHeight,
  boxWidth,
  defaultStrokeWidth,
  disabledColor,
  disabledTextColor,
  emptySlotColor,
  halfBoxWidth,
  highlightColor,
  lockIconFontSize,
  lockIconOffsetX,
  lockIconOffsetY,
  outerStrokeWidth,
  playerNameFontSize,
  strokeColor,
  textColor,
  winnerHighlightColor,
  winnerStrokeWidth,
} from './constants';
import { KonvaMatchProps } from './interfaces';

const KonvaMatch: React.FC<KonvaMatchProps> = ({ match, x, y, isEditMode, onPlayerClick }) => {
  const canMatchProceed = match.round === 1 || (match.player1 !== null && match.player2 !== null);

  const canClickPlayer1 = match.player1 !== null && canMatchProceed;
  const canClickPlayer2 = match.player2 !== null && canMatchProceed;

  const handlePlayer1Click = useCallback(() => {
    if (canClickPlayer1 && match.player1) {
      onPlayerClick(match.id, match.player1);
    }
  }, [match.id, match.player1, onPlayerClick, canClickPlayer1]);

  const handlePlayer2Click = useCallback(() => {
    if (canClickPlayer2 && match.player2) {
      onPlayerClick(match.id, match.player2);
    }
  }, [match.id, match.player2, onPlayerClick, canClickPlayer2]);

  const getPlayerBoxStyle = (player: Player | null, isWinner: boolean, canClick: boolean) => {
    if (!player) {
      return {
        fill: emptySlotColor,
        stroke: strokeColor,
        strokeWidth: defaultStrokeWidth,
        cursor: 'default',
      };
    }

    if (!canClick) {
      return {
        fill: disabledColor,
        stroke: strokeColor,
        strokeWidth: defaultStrokeWidth,
        cursor: 'not-allowed',
      };
    }

    if (isWinner) {
      return {
        fill: winnerHighlightColor,
        stroke: highlightColor,
        strokeWidth: winnerStrokeWidth + 1, // 外框比內框粗一點
        cursor: 'pointer',
      };
    }

    return {
      fill: 'white',
      stroke: strokeColor,
      strokeWidth: defaultStrokeWidth,
      cursor: 'pointer',
    };
  };

  const getTextStyle = (player: Player | null, canClick: boolean) => {
    if (!player) {
      return {
        fill: disabledTextColor,
        text: '待定',
      };
    }

    if (!canClick) {
      return {
        fill: disabledTextColor,
        text: player.name,
      };
    }

    return {
      fill: textColor,
      text: player.name,
    };
  };

  const player1Style = getPlayerBoxStyle(match.player1, match.winner?.id === match.player1?.id, canClickPlayer1);
  const player2Style = getPlayerBoxStyle(match.player2, match.winner?.id === match.player2?.id, canClickPlayer2);

  const player1TextStyle = getTextStyle(match.player1, canClickPlayer1);
  const player2TextStyle = getTextStyle(match.player2, canClickPlayer2);

  return (
    <Group>
      {/* 整個比賽框的外框 - 確保四邊都有完整邊框 */}
      <Rect
        x={x}
        y={y}
        width={boxWidth}
        height={boxHeight}
        fill="transparent"
        stroke={strokeColor}
        strokeWidth={outerStrokeWidth}
        cornerRadius={0}
      />

      {/* 選手1框（左側）- 不要外邊框，避免重複 */}
      <Rect
        x={x}
        y={y}
        width={halfBoxWidth}
        height={boxHeight}
        fill={player1Style.fill}
        stroke="transparent"
        strokeWidth={0}
        onClick={handlePlayer1Click}
        onTap={handlePlayer1Click}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (stage && isEditMode) {
            if (canClickPlayer1) {
              stage.container().style.cursor = 'pointer';
            } else {
              stage.container().style.cursor = 'not-allowed';
            }
          }
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          if (stage) {
            stage.container().style.cursor = 'default';
          }
        }}
      />

      {/* 選手1獲勝時的內框高亮 */}
      {match.winner?.id === match.player1?.id && (
        <Rect
          x={x + defaultStrokeWidth}
          y={y + defaultStrokeWidth}
          width={halfBoxWidth - defaultStrokeWidth * 2}
          height={boxHeight - defaultStrokeWidth * 2}
          fill="transparent"
          stroke={highlightColor}
          strokeWidth={winnerStrokeWidth}
        />
      )}

      {Array.from(player1TextStyle.text).map((text: string, index: number) => (
        <Text
          key={text}
          x={x}
          y={y + halfBoxWidth / 2 + index * (playerNameFontSize + 2)}
          text={text}
          fontSize={playerNameFontSize}
          fill={player1TextStyle.fill}
          width={halfBoxWidth}
          onClick={handlePlayer1Click}
          onTap={handlePlayer1Click}
          ellipsis
          wrap="none"
          align="center"
          verticalAlign="middle"
        />
      ))}

      {/* VS 分隔線 */}
      <Line
        points={[x + halfBoxWidth, y + defaultStrokeWidth, x + halfBoxWidth, y + boxHeight - defaultStrokeWidth]}
        stroke={strokeColor}
        strokeWidth={defaultStrokeWidth}
      />

      {/* 選手2框（右側）- 不要外邊框，避免重複 */}
      <Rect
        x={x + halfBoxWidth}
        y={y}
        width={halfBoxWidth}
        height={boxHeight}
        fill={player2Style.fill}
        stroke="transparent"
        strokeWidth={0}
        onClick={handlePlayer2Click}
        onTap={handlePlayer2Click}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (stage) {
            if (canClickPlayer2) {
              stage.container().style.cursor = 'pointer';
            } else {
              stage.container().style.cursor = 'not-allowed';
            }
          }
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          if (stage) {
            stage.container().style.cursor = 'default';
          }
        }}
      />

      {/* 選手2獲勝時的內框高亮 */}
      {match.winner?.id === match.player2?.id && (
        <Rect
          x={x + halfBoxWidth + defaultStrokeWidth}
          y={y + defaultStrokeWidth}
          width={halfBoxWidth - defaultStrokeWidth * 2}
          height={boxHeight - defaultStrokeWidth * 2}
          fill="transparent"
          stroke={highlightColor}
          strokeWidth={winnerStrokeWidth}
        />
      )}

      {Array.from(player2TextStyle.text).map((text: string, index: number) => (
        <Text
          key={text}
          x={x + halfBoxWidth}
          y={y + halfBoxWidth / 2 + index * (playerNameFontSize + 2)}
          text={text}
          fontSize={playerNameFontSize}
          fill={player2TextStyle.fill}
          width={halfBoxWidth}
          onClick={handlePlayer2Click}
          onTap={handlePlayer2Click}
          ellipsis
          wrap="none"
          align="center"
          verticalAlign="middle"
        />
      ))}

      {/* 如果比賽無法進行，顯示鎖定圖標 */}
      {!canMatchProceed && match.round > 1 && (
        <Text
          x={x + boxWidth - lockIconOffsetX}
          y={y + boxHeight / 2 - lockIconOffsetY}
          text="🔒"
          fontSize={lockIconFontSize}
        />
      )}
    </Group>
  );
};

export default KonvaMatch;
