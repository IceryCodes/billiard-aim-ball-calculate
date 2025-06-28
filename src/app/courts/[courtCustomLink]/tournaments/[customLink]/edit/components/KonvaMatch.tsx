'use client';

import React, { useCallback } from 'react';

import { Group, Line, Rect, Text } from 'react-konva';

import { Gamer } from '@/domains/tournament';

import {
  boxHeight,
  boxWidth,
  defaultStrokeWidth,
  disabledColor,
  disabledTextColor,
  emptySlotColor,
  gamerNameFontSize,
  halfBoxWidth,
  highlightColor,
  lockIconFontSize,
  lockIconOffsetX,
  lockIconOffsetY,
  outerStrokeWidth,
  strokeColor,
  textColor,
  winnerHighlightColor,
  winnerStrokeWidth,
} from './constants';
import { KonvaMatchProps } from './interfaces';

const KonvaMatch: React.FC<KonvaMatchProps> = ({ match, x, y, isEditMode, onGamerClick }) => {
  const canMatchProceed = match.round === 1 || (match.gamer1 !== null && match.gamer2 !== null);

  const canClickGamer1 = match.gamer1 !== null && canMatchProceed;
  const canClickGamer2 = match.gamer2 !== null && canMatchProceed;

  const handleGamer1Click = useCallback(() => {
    if (canClickGamer1 && match.gamer1) {
      onGamerClick(match.id, match.gamer1);
    }
  }, [match.id, match.gamer1, onGamerClick, canClickGamer1]);

  const handleGamer2Click = useCallback(() => {
    if (canClickGamer2 && match.gamer2) {
      onGamerClick(match.id, match.gamer2);
    }
  }, [match.id, match.gamer2, onGamerClick, canClickGamer2]);

  const getGamerBoxStyle = (gamer: Gamer | null, isWinner: boolean, canClick: boolean) => {
    if (!gamer) {
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

  const getTextStyle = (gamer: Gamer | null, canClick: boolean) => {
    if (!gamer) {
      return {
        fill: disabledTextColor,
        text: '待定',
      };
    }

    if (!canClick) {
      return {
        fill: disabledTextColor,
        text: gamer.name,
      };
    }

    return {
      fill: textColor,
      text: gamer.name,
    };
  };

  const gamer1Style = getGamerBoxStyle(match.gamer1, match.winner?.id === match.gamer1?.id, canClickGamer1);
  const gamer2Style = getGamerBoxStyle(match.gamer2, match.winner?.id === match.gamer2?.id, canClickGamer2);

  const gamer1TextStyle = getTextStyle(match.gamer1, canClickGamer1);
  const gamer2TextStyle = getTextStyle(match.gamer2, canClickGamer2);

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
        fill={gamer1Style.fill}
        stroke="transparent"
        strokeWidth={0}
        onClick={handleGamer1Click}
        onTap={handleGamer1Click}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (stage && isEditMode) {
            if (canClickGamer1) {
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
      {match.winner?.id === match.gamer1?.id && (
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

      {Array.from(gamer1TextStyle.text).map((text: string, index: number) => (
        <Text
          key={text}
          x={x}
          y={y + halfBoxWidth / 2 + index * (gamerNameFontSize + 2)}
          text={text}
          fontSize={gamerNameFontSize}
          fill={gamer1TextStyle.fill}
          width={halfBoxWidth}
          onClick={handleGamer1Click}
          onTap={handleGamer1Click}
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
        fill={gamer2Style.fill}
        stroke="transparent"
        strokeWidth={0}
        onClick={handleGamer2Click}
        onTap={handleGamer2Click}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (stage) {
            if (canClickGamer2) {
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
      {match.winner?.id === match.gamer2?.id && (
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

      {Array.from(gamer2TextStyle.text).map((text: string, index: number) => (
        <Text
          key={text}
          x={x + halfBoxWidth}
          y={y + halfBoxWidth / 2 + index * (gamerNameFontSize + 2)}
          text={text}
          fontSize={gamerNameFontSize}
          fill={gamer2TextStyle.fill}
          width={halfBoxWidth}
          onClick={handleGamer2Click}
          onTap={handleGamer2Click}
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
