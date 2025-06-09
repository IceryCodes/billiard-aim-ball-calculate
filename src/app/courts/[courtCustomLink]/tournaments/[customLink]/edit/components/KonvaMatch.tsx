'use client';

import React, { useCallback } from 'react';

import { Group, Line, Rect, Text } from 'react-konva';

import { Player } from '@/domains/tournament';

import { boxHeight, boxWidth } from './constants';
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
        fill: '#f9fafb',
        stroke: '#e5e7eb',
        strokeWidth: 1,
        cursor: 'default',
      };
    }

    if (!canClick) {
      return {
        fill: '#f3f4f6',
        stroke: '#d1d5db',
        strokeWidth: 1,
        cursor: 'not-allowed',
      };
    }

    if (isWinner) {
      return {
        fill: '#fef3c7',
        stroke: '#f97316',
        strokeWidth: 3,
        cursor: 'pointer',
      };
    }

    return {
      fill: 'white',
      stroke: '#d1d5db',
      strokeWidth: 1,
      cursor: 'pointer',
    };
  };

  const getTextStyle = (player: Player | null, canClick: boolean) => {
    if (!player) {
      return {
        fill: '#9ca3af',
        text: '待定',
      };
    }

    if (!canClick) {
      return {
        fill: '#9ca3af',
        text: player.name,
      };
    }

    return {
      fill: '#000000',
      text: player.name,
    };
  };

  const player1Style = getPlayerBoxStyle(match.player1, match.winner?.id === match.player1?.id, canClickPlayer1);
  const player2Style = getPlayerBoxStyle(match.player2, match.winner?.id === match.player2?.id, canClickPlayer2);

  const player1TextStyle = getTextStyle(match.player1, canClickPlayer1);
  const player2TextStyle = getTextStyle(match.player2, canClickPlayer2);

  // 橫向佈局：兩個選手左右並排，而不是上下排列
  const halfWidth = boxWidth / 2;

  return (
    <Group>
      {/* 整個比賽框的外框 - 確保四邊都有完整邊框 */}
      <Rect
        x={x}
        y={y}
        width={boxWidth}
        height={boxHeight}
        fill="transparent"
        stroke="#d1d5db"
        strokeWidth={1}
        cornerRadius={0}
      />

      {/* 選手1框（左側）- 不要外邊框，避免重複 */}
      <Rect
        x={x}
        y={y}
        width={halfWidth}
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
          x={x + 1}
          y={y + 1}
          width={halfWidth - 2}
          height={boxHeight - 2}
          fill="transparent"
          stroke="#f97316"
          strokeWidth={2}
        />
      )}

      <Text
        x={x}
        y={y + (boxHeight - 12) / 2}
        text={player1TextStyle.text}
        fontSize={12}
        fill={player1TextStyle.fill}
        width={halfWidth}
        onClick={handlePlayer1Click}
        onTap={handlePlayer1Click}
        ellipsis
        wrap="none"
        align="center"
        verticalAlign="middle"
      />

      {/* VS 分隔線 */}
      <Line points={[x + halfWidth, y + 1, x + halfWidth, y + boxHeight - 1]} stroke="#d1d5db" strokeWidth={1} />

      {/* 選手2框（右側）- 不要外邊框，避免重複 */}
      <Rect
        x={x + halfWidth}
        y={y}
        width={halfWidth}
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
          x={x + halfWidth + 1}
          y={y + 1}
          width={halfWidth - 2}
          height={boxHeight - 2}
          fill="transparent"
          stroke="#f97316"
          strokeWidth={2}
        />
      )}

      <Text
        x={x + halfWidth}
        y={y + (boxHeight - 12) / 2}
        text={player2TextStyle.text}
        fontSize={12}
        fill={player2TextStyle.fill}
        width={halfWidth}
        onClick={handlePlayer2Click}
        onTap={handlePlayer2Click}
        ellipsis
        wrap="none"
        align="center"
        verticalAlign="middle"
      />

      {/* 如果比賽無法進行，顯示鎖定圖標 */}
      {!canMatchProceed && match.round > 1 && (
        <Text x={x + boxWidth - 20} y={y + boxHeight / 2 - 8} text="🔒" fontSize={16} />
      )}
    </Group>
  );
};

export default KonvaMatch;
