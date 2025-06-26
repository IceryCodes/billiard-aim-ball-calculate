import React, { useCallback, useEffect, useRef, useState } from 'react';

import { KonvaEventObject } from 'konva/lib/Node';
import { Stage as KonvaStage } from 'konva/lib/Stage';
import { Group, Line, Rect, Text } from 'react-konva';
import { Html } from 'react-konva-utils';

import { Match, Player } from '@/domains/tournament';

import {
  boxHeight,
  boxWidth,
  defaultStrokeWidth,
  disabledColor,
  disabledTextColor,
  editableEmptyPlayerBoxBackgroundColor,
  editingIndicatorBackgroundColor,
  editingIndicatorBorderColor,
  editingTextColor,
  EditMode,
  emptyPlayerBoxBackgroundColor,
  emptyPlayerBoxStrokeColor,
  emptySlotColor,
  halfBoxWidth,
  highlightColor,
  lockIconFontSize,
  lockIconOffsetX,
  lockIconOffsetY,
  outerStrokeWidth,
  playerBoxBackgroundColor,
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
  onConfirmEdit: (newValue: string) => void;
  onCancelEdit: () => void;
}

interface PlayerTextEditorProps {
  initialValue: string;
  x: number;
  y: number;
  width: number;
  height: number;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

const PlayerTextEditor: React.FC<PlayerTextEditorProps> = ({ initialValue, x, y, width, height, onConfirm, onCancel }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialValue);
  const [hasFocused, setHasFocused] = useState(false);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const timer = setTimeout(() => {
      input.focus();
      // 只在第一次聚焦時選取文字，之後就不再選取
      if (!hasFocused && initialValue) {
        input.select();
        setHasFocused(true);
      } else {
        // 將游標移到文字末尾
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm(value.trim());
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    const handleBlur = () => {
      setTimeout(() => {
        onConfirm(value.trim());
      }, 100);
    };

    input.addEventListener('keydown', handleKeyDown);
    input.addEventListener('blur', handleBlur);

    return () => {
      clearTimeout(timer);
      input.removeEventListener('keydown', handleKeyDown);
      input.removeEventListener('blur', handleBlur);
    };
  }, [value, onConfirm, onCancel, hasFocused, initialValue]);

  return (
    <Html>
      <div
        style={{
          position: 'fixed',
          left: x - 50, // 向左擴展 10px
          top: y, // 向上擴展 5px
          width: width + 100, // 寬度增加 20px
          height, // 高度增加 10px
          zIndex: 10000,
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue.length <= 8) {
              setValue(newValue);
            }
          }}
          maxLength={8}
          placeholder="輸入名稱"
          style={{
            width: '100%',
            height: '100%',
            fontSize: `${Math.min(playerNameFontSize + 2, 20)}px`, // 稍微增大字體
            border: `2px solid ${editingIndicatorBorderColor}`,
            borderRadius: '4px', // 稍微圓角
            padding: '6px 8px', // 增加內邊距
            margin: '0',
            background: editingIndicatorBackgroundColor,
            outline: 'none',
            textAlign: 'center',
            color: editingTextColor,
            fontWeight: 'bold',
            boxSizing: 'border-box',
            fontFamily: 'Arial, sans-serif',
            // 確保文字不會被截斷
            overflow: 'visible',
            whiteSpace: 'nowrap',
          }}
        />
      </div>
    </Html>
  );
};

const EditableKonvaMatch: React.FC<EditableKonvaMatchProps> = ({
  match,
  x,
  y,
  isEditMode,
  editMode,
  playerEditState,
  onPlayerClick,
  onPlayerDoubleClick,
  onConfirmEdit,
  onCancelEdit,
}) => {
  const canMatchProceed = match.round === 1 || (match.player1 !== null && match.player2 !== null);

  const isPlayer1Empty = !match.player1 || !match.player1.name || match.player1.name.trim() === '';
  const isPlayer2Empty = !match.player2 || !match.player2.name || match.player2.name.trim() === '';

  const canClickPlayer1 = !isPlayer1Empty && canMatchProceed && editMode !== EditMode.PLAYER_EDIT;
  const canClickPlayer2 = !isPlayer2Empty && canMatchProceed && editMode !== EditMode.PLAYER_EDIT;

  const handlePlayer1Click = useCallback(() => {
    if (editMode === EditMode.PLAYER_EDIT) return;
    if (!isPlayer1Empty && canClickPlayer1 && match.player1) {
      onPlayerClick(match.id, match.player1);
    }
  }, [match.id, match.player1, onPlayerClick, canClickPlayer1, editMode, isPlayer1Empty]);

  const handlePlayer2Click = useCallback(() => {
    if (editMode === EditMode.PLAYER_EDIT) return;
    if (!isPlayer2Empty && canClickPlayer2 && match.player2) {
      onPlayerClick(match.id, match.player2);
    }
  }, [match.id, match.player2, onPlayerClick, canClickPlayer2, editMode, isPlayer2Empty]);

  const handlePlayer1DoubleClick = useCallback(() => {
    if (editMode === EditMode.PLAYER_EDIT) {
      const playerToEdit = match.player1 || {
        id: -Math.abs(parseInt(match.id) * 10 + 1),
        name: '',
      };
      onPlayerDoubleClick(playerToEdit);
    }
  }, [match.player1, match.id, onPlayerDoubleClick, editMode]);

  const handlePlayer2DoubleClick = useCallback(() => {
    if (editMode === EditMode.PLAYER_EDIT) {
      const playerToEdit = match.player2 || {
        id: -Math.abs(parseInt(match.id) * 10 + 2),
        name: '',
      };
      onPlayerDoubleClick(playerToEdit);
    }
  }, [match.player2, match.id, onPlayerDoubleClick, editMode]);

  const isEditingPlayer1 =
    playerEditState.isEditing &&
    ((match.player1 !== null && playerEditState.playerId === match.player1.id) ||
      playerEditState.playerId === -Math.abs(parseInt(match.id) * 10 + 1));
  const isEditingPlayer2 =
    playerEditState.isEditing &&
    ((match.player2 !== null && playerEditState.playerId === match.player2.id) ||
      playerEditState.playerId === -Math.abs(parseInt(match.id) * 10 + 2));

  const getPlayerBoxStyle = (player: Player | null, isWinner: boolean, canClick: boolean, isEmpty: boolean) => {
    if (isEmpty && editMode !== EditMode.PLAYER_EDIT) {
      return {
        fill: emptyPlayerBoxBackgroundColor,
        stroke: emptyPlayerBoxStrokeColor,
        strokeWidth: defaultStrokeWidth,
        cursor: 'default',
      };
    }

    if (!player) {
      return {
        fill: emptySlotColor,
        stroke: strokeColor,
        strokeWidth: defaultStrokeWidth,
        cursor: 'default',
      };
    }

    if (editMode === EditMode.PLAYER_EDIT) {
      if (isEmpty) {
        return {
          fill: editableEmptyPlayerBoxBackgroundColor,
          stroke: strokeColor,
          strokeWidth: defaultStrokeWidth,
          cursor: 'text',
        };
      }
      if (isWinner) {
        return {
          fill: winnerHighlightColor,
          stroke: highlightColor,
          strokeWidth: winnerStrokeWidth + 1,
          cursor: 'text',
        };
      }
      return {
        fill: playerBoxBackgroundColor,
        stroke: strokeColor,
        strokeWidth: defaultStrokeWidth,
        cursor: 'text',
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
        strokeWidth: winnerStrokeWidth + 1,
        cursor: 'pointer',
      };
    }

    return {
      fill: playerBoxBackgroundColor,
      stroke: strokeColor,
      strokeWidth: defaultStrokeWidth,
      cursor: 'pointer',
    };
  };

  const getTextStyle = (player: Player | null, canClick: boolean, isEmpty: boolean) => {
    if (isEmpty) {
      if (editMode === EditMode.PLAYER_EDIT) {
        return {
          fill: disabledTextColor,
          text: player?.name || '空籤',
        };
      }
      return {
        fill: disabledTextColor,
        text: '空籤',
      };
    }

    if (!player) {
      return {
        fill: disabledTextColor,
        text: '待定',
      };
    }

    if (editMode === EditMode.PLAYER_EDIT) {
      return {
        fill: textColor,
        text: player.name,
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

  const player1Style = getPlayerBoxStyle(
    match.player1,
    !!(match.winner && match.player1 && match.winner.id === match.player1.id),
    canClickPlayer1,
    isPlayer1Empty
  );
  const player2Style = getPlayerBoxStyle(
    match.player2,
    !!(match.winner && match.player2 && match.winner.id === match.player2.id),
    canClickPlayer2,
    isPlayer2Empty
  );
  const player1TextStyle = getTextStyle(match.player1, canClickPlayer1, isPlayer1Empty);
  const player2TextStyle = getTextStyle(match.player2, canClickPlayer2, isPlayer2Empty);

  const handleMouseEnter = useCallback(
    (e: KonvaEventObject<MouseEvent>, cursor: string) => {
      const stage = e.target.getStage() as KonvaStage | null;
      if (stage && isEditMode) {
        stage.container().style.cursor = cursor;
      }
    },
    [isEditMode]
  );

  const handleMouseLeave = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage() as KonvaStage | null;
    if (stage) {
      stage.container().style.cursor = 'default';
    }
  }, []);

  return (
    <Group>
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

      <Rect
        x={x}
        y={y}
        width={halfBoxWidth}
        height={boxHeight}
        fill={player1Style.fill}
        stroke="transparent"
        strokeWidth={0}
        onClick={(e: KonvaEventObject<MouseEvent>) => {
          if (playerEditState.isEditing) {
            e.evt.stopPropagation();
            return;
          }
          if (editMode !== EditMode.PLAYER_EDIT && isPlayer1Empty) {
            return;
          }
          handlePlayer1Click();
        }}
        onDblClick={(e: KonvaEventObject<MouseEvent>) => {
          if (editMode === EditMode.PLAYER_EDIT) {
            e.evt.preventDefault();
            e.evt.stopPropagation();
            handlePlayer1DoubleClick();
          }
        }}
        onTap={handlePlayer1Click}
        onMouseEnter={(e: KonvaEventObject<MouseEvent>) => handleMouseEnter(e, player1Style.cursor)}
        onMouseLeave={handleMouseLeave}
      />

      {isEditingPlayer1 && (
        <PlayerTextEditor
          initialValue={playerEditState.tempName}
          x={x}
          y={y}
          width={halfBoxWidth}
          height={boxHeight}
          onConfirm={onConfirmEdit}
          onCancel={onCancelEdit}
        />
      )}

      {!isEditingPlayer1 &&
        Array.from(player1TextStyle.text).map((text: string, index: number) => (
          <Text
            key={`player1-${index}`}
            x={x}
            y={y + boxHeight / 4 + index * (playerNameFontSize + 2)}
            text={text}
            fontSize={playerNameFontSize}
            fill={player1TextStyle.fill}
            width={halfBoxWidth}
            onClick={(e: KonvaEventObject<MouseEvent>) => {
              if (editMode === EditMode.PLAYER_EDIT) {
                e.evt.stopPropagation();
                return;
              }
              if (!isPlayer1Empty) {
                handlePlayer1Click();
              }
            }}
            onDblClick={(e: KonvaEventObject<MouseEvent>) => {
              if (editMode === EditMode.PLAYER_EDIT) {
                e.evt.preventDefault();
                e.evt.stopPropagation();
                handlePlayer1DoubleClick();
              }
            }}
            onTap={() => {
              if (editMode === EditMode.PLAYER_EDIT) {
                return;
              }
              if (!isPlayer1Empty) {
                handlePlayer1Click();
              }
            }}
            ellipsis
            wrap="none"
            align="center"
            verticalAlign="middle"
            listening={editMode === EditMode.PLAYER_EDIT}
          />
        ))}

      <Line
        points={[x + halfBoxWidth, y + defaultStrokeWidth, x + halfBoxWidth, y + boxHeight - defaultStrokeWidth]}
        stroke={strokeColor}
        strokeWidth={defaultStrokeWidth}
      />

      <Rect
        x={x + halfBoxWidth}
        y={y}
        width={halfBoxWidth}
        height={boxHeight}
        fill={player2Style.fill}
        stroke="transparent"
        strokeWidth={0}
        onClick={(e: KonvaEventObject<MouseEvent>) => {
          if (playerEditState.isEditing) {
            e.evt.stopPropagation();
            return;
          }
          if (editMode !== EditMode.PLAYER_EDIT && isPlayer2Empty) {
            return;
          }
          handlePlayer2Click();
        }}
        onDblClick={(e: KonvaEventObject<MouseEvent>) => {
          if (editMode === EditMode.PLAYER_EDIT) {
            e.evt.preventDefault();
            e.evt.stopPropagation();
            handlePlayer2DoubleClick();
          }
        }}
        onTap={handlePlayer2Click}
        onMouseEnter={(e: KonvaEventObject<MouseEvent>) => handleMouseEnter(e, player2Style.cursor)}
        onMouseLeave={handleMouseLeave}
      />

      {isEditingPlayer2 && (
        <PlayerTextEditor
          initialValue={playerEditState.tempName}
          x={x + halfBoxWidth}
          y={y}
          width={halfBoxWidth}
          height={boxHeight}
          onConfirm={onConfirmEdit}
          onCancel={onCancelEdit}
        />
      )}

      {!isEditingPlayer2 &&
        Array.from(player2TextStyle.text).map((text: string, index: number) => (
          <Text
            key={`player2-${index}`}
            x={x + halfBoxWidth}
            y={y + boxHeight / 4 + index * (playerNameFontSize + 2)}
            text={text}
            fontSize={playerNameFontSize}
            fill={player2TextStyle.fill}
            width={halfBoxWidth}
            onClick={(e: KonvaEventObject<MouseEvent>) => {
              if (editMode === EditMode.PLAYER_EDIT) {
                e.evt.stopPropagation();
                return;
              }
              if (!isPlayer2Empty) {
                handlePlayer2Click();
              }
            }}
            onDblClick={(e: KonvaEventObject<MouseEvent>) => {
              if (editMode === EditMode.PLAYER_EDIT) {
                e.evt.preventDefault();
                e.evt.stopPropagation();
                handlePlayer2DoubleClick();
              }
            }}
            onTap={() => {
              if (editMode === EditMode.PLAYER_EDIT) {
                return;
              }
              if (!isPlayer2Empty) {
                handlePlayer2Click();
              }
            }}
            ellipsis
            wrap="none"
            align="center"
            verticalAlign="middle"
            listening={editMode === EditMode.PLAYER_EDIT}
          />
        ))}

      {match.winner && match.player1 && match.winner.id === match.player1.id && (
        <Rect
          x={x + defaultStrokeWidth}
          y={y + defaultStrokeWidth}
          width={halfBoxWidth - defaultStrokeWidth * 2}
          height={boxHeight - defaultStrokeWidth * 2}
          fill="transparent"
          stroke={highlightColor}
          strokeWidth={winnerStrokeWidth}
          listening={false}
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
          listening={false}
        />
      )}

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
