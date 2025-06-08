'use client';

import React, { useCallback } from 'react';

import { Group, Rect, Text } from 'react-konva';

import { Player } from '@/domains/tournament';

import { boxHeight, boxWidth } from './constants';
import { KonvaMatchProps } from './interfaces';

const KonvaMatch: React.FC<KonvaMatchProps> = ({ match, x, y, onPlayerClick }) => {
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

  return (
    <Group>
      <Rect
        x={x}
        y={y}
        width={boxWidth}
        height={boxHeight}
        fill={player1Style.fill}
        stroke={player1Style.stroke}
        strokeWidth={player1Style.strokeWidth}
        onClick={handlePlayer1Click}
        onTap={handlePlayer1Click}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (stage) {
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
      <Text
        x={x + 6}
        y={y + (boxHeight - 12) / 2}
        text={player1TextStyle.text}
        fontSize={12}
        fill={player1TextStyle.fill}
        width={boxWidth - 12}
        onClick={handlePlayer1Click}
        onTap={handlePlayer1Click}
        ellipsis
        wrap="none"
        verticalAlign="middle"
      />

      <Rect
        x={x}
        y={y + boxHeight}
        width={boxWidth}
        height={boxHeight}
        fill={player2Style.fill}
        stroke={player2Style.stroke}
        strokeWidth={player2Style.strokeWidth}
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
      <Text
        x={x + 6}
        y={y + boxHeight + (boxHeight - 12) / 2}
        text={player2TextStyle.text}
        fontSize={12}
        fill={player2TextStyle.fill}
        width={boxWidth - 12}
        onClick={handlePlayer2Click}
        onTap={handlePlayer2Click}
        ellipsis
        wrap="none"
        verticalAlign="middle"
      />

      {!canMatchProceed && match.round > 1 && (
        <Text x={x + boxWidth - 16} y={y + boxHeight / 2 + 3} text="🔒" fontSize={11} />
      )}
    </Group>
  );
};

export default KonvaMatch;
