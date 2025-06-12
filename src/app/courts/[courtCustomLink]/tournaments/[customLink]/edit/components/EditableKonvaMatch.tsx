import React, { useCallback, useEffect } from 'react';

import { Group, Line, Rect, Text } from 'react-konva';

import { Match, Player } from '@/domains/tournament';

import {
  boxHeight,
  boxWidth,
  defaultStrokeWidth,
  disabledColor,
  disabledTextColor,
  EditMode,
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
import { PlayerEditState } from './interfaces';

interface EditableKonvaMatchProps {
  match: Match;
  x: number;
  y: number;
  isEditMode: boolean;
  editMode: EditMode;
  playerEditState: PlayerEditState;
  onPlayerClick: (matchId: string, player: Player) => void;
  onPlayerDoubleClick: (player: Player) => void;
  onEditStateChange: (state: PlayerEditState) => void;
  onConfirmEdit: () => void;
  onCancelEdit: () => void;
}

const EditableKonvaMatch: React.FC<EditableKonvaMatchProps> = ({
  match,
  x,
  y,
  isEditMode,
  editMode,
  playerEditState,
  onPlayerClick,
  onPlayerDoubleClick,
  onEditStateChange,
  onConfirmEdit,
  onCancelEdit,
}) => {
  const canMatchProceed = match.round === 1 || (match.player1 !== null && match.player2 !== null);
  const canClickPlayer1 = match.player1 !== null && canMatchProceed;
  const canClickPlayer2 = match.player2 !== null && canMatchProceed;

  // 修正後的選手1單擊處理
  const handlePlayer1Click = useCallback(() => {
    if (editMode === EditMode.PLAYER_EDIT && match.player1) {
      // 在編輯模式下，單擊不應該觸發選擇獲勝者
      return;
    }

    if (canClickPlayer1 && match.player1) {
      onPlayerClick(match.id, match.player1);
    }
  }, [match.id, match.player1, onPlayerClick, canClickPlayer1, editMode]);

  // 修正後的選手2單擊處理
  const handlePlayer2Click = useCallback(() => {
    if (editMode === EditMode.PLAYER_EDIT && match.player2) {
      // 在編輯模式下，單擊不應該觸發選擇獲勝者
      return;
    }

    if (canClickPlayer2 && match.player2) {
      onPlayerClick(match.id, match.player2);
    }
  }, [match.id, match.player2, onPlayerClick, canClickPlayer2, editMode]);

  // 修正後的選手1雙擊處理
  const handlePlayer1DoubleClick = useCallback(() => {
    // 只有在編輯模式且是第一輪才允許編輯選手名稱
    if (editMode === EditMode.PLAYER_EDIT && match.player1 && match.round === 1) {
      onPlayerDoubleClick(match.player1);
    }
  }, [match.player1, match.round, onPlayerDoubleClick, editMode]);

  // 修正後的選手2雙擊處理
  const handlePlayer2DoubleClick = useCallback(() => {
    // 只有在編輯模式且是第一輪才允許編輯選手名稱
    if (editMode === EditMode.PLAYER_EDIT && match.player2 && match.round === 1) {
      onPlayerDoubleClick(match.player2);
    }
  }, [match.player2, match.round, onPlayerDoubleClick, editMode]);

  // 判斷是否在編輯狀態
  const isEditingPlayer1 =
    playerEditState.isEditing && match.player1 !== null && playerEditState.playerId === match.player1.id;
  const isEditingPlayer2 =
    playerEditState.isEditing && match.player2 !== null && playerEditState.playerId === match.player2.id;

  // 渲染編輯中的視覺提示
  const renderEditingIndicator = (inputX: number, inputY: number, width: number) => {
    return (
      <Group>
        {/* 編輯中的背景 */}
        <Rect x={inputX} y={inputY} width={width} height={boxHeight} fill="#e3f2fd" stroke="#2196f3" strokeWidth={2} />
        {/* 編輯中的文字 */}
        <Text
          x={inputX}
          y={inputY + boxHeight / 2 - 8}
          text={playerEditState.tempName || '輸入姓名...'}
          fontSize={playerNameFontSize}
          fill="#1976d2"
          width={width}
          align="center"
          verticalAlign="middle"
        />
        {/* 游標指示 */}
        <Rect
          x={inputX + width / 2 + playerEditState.tempName.length * 6}
          y={inputY + boxHeight / 2 - 10}
          width={2}
          height={20}
          fill="#1976d2"
        />
      </Group>
    );
  };

  // 處理鍵盤輸入的效果
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!playerEditState.isEditing) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirmEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancelEdit();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        onEditStateChange({
          ...playerEditState,
          tempName: playerEditState.tempName.slice(0, -1),
        });
      } else if (e.key.length === 1) {
        // 只處理可見字符
        e.preventDefault();
        onEditStateChange({
          ...playerEditState,
          tempName: playerEditState.tempName + e.key,
        });
      }
    };

    if (playerEditState.isEditing) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [playerEditState, onEditStateChange, onConfirmEdit, onCancelEdit]);

  const getPlayerBoxStyle = (player: Player | null, isWinner: boolean, canClick: boolean) => {
    if (!player) {
      return {
        fill: emptySlotColor,
        stroke: strokeColor,
        strokeWidth: defaultStrokeWidth,
        cursor: 'default',
      };
    }

    if (!canClick && editMode !== EditMode.PLAYER_EDIT) {
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
        strokeWidth: winnerStrokeWidth + 1,
        cursor: editMode === EditMode.PLAYER_EDIT && match.round === 1 ? 'text' : 'pointer',
      };
    }

    return {
      fill: 'white',
      stroke: strokeColor,
      strokeWidth: defaultStrokeWidth,
      cursor: editMode === EditMode.PLAYER_EDIT && match.round === 1 ? 'text' : 'pointer',
    };
  };

  const getTextStyle = (player: Player | null, canClick: boolean) => {
    if (!player) {
      return {
        fill: disabledTextColor,
        text: '待定',
      };
    }

    if (!canClick && editMode !== EditMode.PLAYER_EDIT) {
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

  const player1Style = getPlayerBoxStyle(
    match.player1,
    !!(match.winner && match.player1 && match.winner.id === match.player1.id),
    canClickPlayer1
  );
  const player2Style = getPlayerBoxStyle(
    match.player2,
    !!(match.winner && match.player2 && match.winner.id === match.player2.id),
    canClickPlayer2
  );
  const player1TextStyle = getTextStyle(match.player1, canClickPlayer1);
  const player2TextStyle = getTextStyle(match.player2, canClickPlayer2);

  return (
    <Group>
      {/* 外框 */}
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

      {/* 選手1框 */}
      <Rect
        x={x}
        y={y}
        width={halfBoxWidth}
        height={boxHeight}
        fill={player1Style.fill}
        stroke="transparent"
        strokeWidth={0}
        onClick={handlePlayer1Click}
        onDblClick={handlePlayer1DoubleClick}
        onTap={handlePlayer1Click}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (stage && isEditMode) {
            stage.container().style.cursor = player1Style.cursor;
          }
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          if (stage) {
            stage.container().style.cursor = 'default';
          }
        }}
      />

      {/* 選手1文字或編輯指示 */}
      {isEditingPlayer1 && match.player1
        ? renderEditingIndicator(x, y, halfBoxWidth)
        : Array.from(player1TextStyle.text).map((text: string, index: number) => (
            <Text
              key={index}
              x={x}
              y={y + boxHeight / 4 + index * (playerNameFontSize + 2)}
              text={text}
              fontSize={playerNameFontSize}
              fill={player1TextStyle.fill}
              width={halfBoxWidth}
              onClick={handlePlayer1Click}
              onDblClick={handlePlayer1DoubleClick}
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

      {/* 選手2框 */}
      <Rect
        x={x + halfBoxWidth}
        y={y}
        width={halfBoxWidth}
        height={boxHeight}
        fill={player2Style.fill}
        stroke="transparent"
        strokeWidth={0}
        onClick={handlePlayer2Click}
        onDblClick={handlePlayer2DoubleClick}
        onTap={handlePlayer2Click}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (stage) {
            stage.container().style.cursor = player2Style.cursor;
          }
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          if (stage) {
            stage.container().style.cursor = 'default';
          }
        }}
      />

      {/* 選手2文字或編輯指示 */}
      {isEditingPlayer2 && match.player2
        ? renderEditingIndicator(x + halfBoxWidth, y, halfBoxWidth)
        : Array.from(player2TextStyle.text).map((text: string, index: number) => (
            <Text
              key={index}
              x={x + halfBoxWidth}
              y={y + boxHeight / 4 + index * (playerNameFontSize + 2)}
              text={text}
              fontSize={playerNameFontSize}
              fill={player2TextStyle.fill}
              width={halfBoxWidth}
              onClick={handlePlayer2Click}
              onDblClick={handlePlayer2DoubleClick}
              onTap={handlePlayer2Click}
              ellipsis
              wrap="none"
              align="center"
              verticalAlign="middle"
            />
          ))}

      {/* 獲勝者高亮框 */}
      {match.winner && match.player1 && match.winner.id === match.player1.id && (
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

      {match.winner && match.player2 && match.winner.id === match.player2.id && (
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

      {/* 鎖定圖標 */}
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

export default EditableKonvaMatch;
