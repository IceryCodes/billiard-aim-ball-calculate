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

// 添加遊戲局數相關的常數
const gamesBoxWidth = 50;
const gamesBoxHeight = 30;
const gamesBoxMarginTop = 5;
const gamesFontSize = 16;
const gamesBoxBackgroundColor = '#f0f0f0';
const gamesBoxBorderColor = '#d0d0d0';
const gamesBoxTextColor = '#333333';
const editableGamesBoxBackgroundColor = '#ffffff';
const editingGamesBoxBorderColor = '#2196f3';
const editingGamesBoxBackgroundColor = '#e3f2fd';

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
  onGamesEdit?: (playerId: number, newGames: number) => void;
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

interface GamesEditorProps {
  initialValue: number;
  x: number;
  y: number;
  width: number;
  height: number;
  onConfirm: (value: number) => void;
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
      if (!hasFocused && initialValue) {
        input.select();
        setHasFocused(true);
      } else {
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
          left: x - 50,
          top: y,
          width: width + 100,
          height,
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
            fontSize: `${Math.min(playerNameFontSize + 2, 20)}px`,
            border: `2px solid ${editingIndicatorBorderColor}`,
            borderRadius: '4px',
            padding: '6px 8px',
            margin: '0',
            background: editingIndicatorBackgroundColor,
            outline: 'none',
            textAlign: 'center',
            color: editingTextColor,
            fontWeight: 'bold',
            boxSizing: 'border-box',
            fontFamily: 'Arial, sans-serif',
            overflow: 'visible',
            whiteSpace: 'nowrap',
          }}
        />
      </div>
    </Html>
  );
};

const GamesEditor: React.FC<GamesEditorProps> = ({ initialValue, x, y, width, height, onConfirm, onCancel }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialValue.toString());

  useEffect(() => {
    setValue(initialValue.toString());
  }, [initialValue]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const timer = setTimeout(() => {
      input.focus();
      input.select();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        const numValue = parseInt(value) || 7;
        onConfirm(Math.max(1, Math.min(99, numValue))); // 限制範圍 1-99
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    // 添加 onBlur 事件處理，與 PlayerTextEditor 保持一致
    const handleBlur = () => {
      setTimeout(() => {
        const numValue = parseInt(value) || 7;
        onConfirm(Math.max(1, Math.min(99, numValue)));
      }, 100);
    };

    input.addEventListener('keydown', handleKeyDown);
    input.addEventListener('blur', handleBlur); // 添加 blur 事件監聽

    return () => {
      clearTimeout(timer);
      input.removeEventListener('keydown', handleKeyDown);
      input.removeEventListener('blur', handleBlur); // 清理 blur 事件監聽
    };
  }, [value, onConfirm, onCancel]);

  return (
    <Html>
      <div
        style={{
          position: 'fixed',
          left: x,
          top: y,
          width,
          height,
          zIndex: 10000,
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="number"
          min="1"
          max="99"
          value={value}
          onChange={(e) => {
            const newValue = e.target.value;
            if (newValue.length <= 2) {
              setValue(newValue);
            }
          }}
          style={{
            width: '100%',
            height: '100%',
            fontSize: `${gamesFontSize}px`,
            border: `2px solid ${editingGamesBoxBorderColor}`,
            borderRadius: '4px',
            padding: '4px',
            margin: '0',
            background: editingGamesBoxBackgroundColor,
            outline: 'none',
            textAlign: 'center',
            color: editingTextColor,
            fontWeight: 'bold',
            boxSizing: 'border-box',
            fontFamily: 'Arial, sans-serif',
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
  onGamesEdit,
}) => {
  const [editingGames, setEditingGames] = useState<{ playerId: number; side: 'left' | 'right' } | null>(null);

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
        games: 7,
      };
      onPlayerDoubleClick(playerToEdit);
    }
  }, [match.player1, match.id, onPlayerDoubleClick, editMode]);

  const handlePlayer2DoubleClick = useCallback(() => {
    if (editMode === EditMode.PLAYER_EDIT) {
      const playerToEdit = match.player2 || {
        id: -Math.abs(parseInt(match.id) * 10 + 2),
        name: '',
        games: 7,
      };
      onPlayerDoubleClick(playerToEdit);
    }
  }, [match.player2, match.id, onPlayerDoubleClick, editMode]);

  const handleGames1DoubleClick = useCallback(() => {
    if (editMode === EditMode.PLAYER_EDIT && match.player1 && onGamesEdit) {
      setEditingGames({ playerId: match.player1.id, side: 'left' });
    }
  }, [editMode, match.player1, onGamesEdit]);

  const handleGames2DoubleClick = useCallback(() => {
    if (editMode === EditMode.PLAYER_EDIT && match.player2 && onGamesEdit) {
      setEditingGames({ playerId: match.player2.id, side: 'right' });
    }
  }, [editMode, match.player2, onGamesEdit]);

  const handleGamesConfirm = useCallback(
    (newGames: number) => {
      if (editingGames && onGamesEdit) {
        onGamesEdit(editingGames.playerId, newGames);
      }
      setEditingGames(null);
    },
    [editingGames, onGamesEdit]
  );

  const handleGamesCancel = useCallback(() => {
    setEditingGames(null);
  }, []);

  const isEditingPlayer1 =
    playerEditState.isEditing &&
    ((match.player1 !== null && playerEditState.playerId === match.player1.id) ||
      playerEditState.playerId === -Math.abs(parseInt(match.id) * 10 + 1));
  const isEditingPlayer2 =
    playerEditState.isEditing &&
    ((match.player2 !== null && playerEditState.playerId === match.player2.id) ||
      playerEditState.playerId === -Math.abs(parseInt(match.id) * 10 + 2));

  const isEditingGames1 = editingGames?.side === 'left';
  const isEditingGames2 = editingGames?.side === 'right';

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

  // 只在第一輪顯示遊戲局數框
  const showGamesBox = match.round === 1;

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

      {/* 遊戲局數框 - 只在第一輪顯示 */}
      {showGamesBox && (
        <Group>
          {/* 左側選手遊戲局數框 */}
          <Rect
            x={x + (halfBoxWidth - gamesBoxWidth) / 2}
            y={y + boxHeight + gamesBoxMarginTop}
            width={gamesBoxWidth}
            height={gamesBoxHeight}
            fill={editMode === EditMode.PLAYER_EDIT ? editableGamesBoxBackgroundColor : gamesBoxBackgroundColor}
            stroke={gamesBoxBorderColor}
            strokeWidth={1}
            cornerRadius={4}
            onDblClick={handleGames1DoubleClick}
            onMouseEnter={(e: KonvaEventObject<MouseEvent>) =>
              handleMouseEnter(e, editMode === EditMode.PLAYER_EDIT ? 'text' : 'default')
            }
            onMouseLeave={handleMouseLeave}
          />

          {isEditingGames1 && match.player1 ? (
            <GamesEditor
              initialValue={match.player1.games || 7}
              x={x + (halfBoxWidth - gamesBoxWidth) / 2}
              y={y + boxHeight + gamesBoxMarginTop}
              width={gamesBoxWidth}
              height={gamesBoxHeight}
              onConfirm={handleGamesConfirm}
              onCancel={handleGamesCancel}
            />
          ) : (
            <Text
              x={x + (halfBoxWidth - gamesBoxWidth) / 2}
              y={y + boxHeight + gamesBoxMarginTop}
              width={gamesBoxWidth}
              height={gamesBoxHeight}
              text={(match.player1?.games || 7).toString()}
              fontSize={gamesFontSize}
              fill={gamesBoxTextColor}
              align="center"
              verticalAlign="middle"
              onDblClick={handleGames1DoubleClick}
            />
          )}

          {/* 右側選手遊戲局數框 */}
          <Rect
            x={x + halfBoxWidth + (halfBoxWidth - gamesBoxWidth) / 2}
            y={y + boxHeight + gamesBoxMarginTop}
            width={gamesBoxWidth}
            height={gamesBoxHeight}
            fill={editMode === EditMode.PLAYER_EDIT ? editableGamesBoxBackgroundColor : gamesBoxBackgroundColor}
            stroke={gamesBoxBorderColor}
            strokeWidth={1}
            cornerRadius={4}
            onDblClick={handleGames2DoubleClick}
            onMouseEnter={(e: KonvaEventObject<MouseEvent>) =>
              handleMouseEnter(e, editMode === EditMode.PLAYER_EDIT ? 'text' : 'default')
            }
            onMouseLeave={handleMouseLeave}
          />

          {isEditingGames2 && match.player2 ? (
            <GamesEditor
              initialValue={match.player2.games || 7}
              x={x + halfBoxWidth + (halfBoxWidth - gamesBoxWidth) / 2}
              y={y + boxHeight + gamesBoxMarginTop}
              width={gamesBoxWidth}
              height={gamesBoxHeight}
              onConfirm={handleGamesConfirm}
              onCancel={handleGamesCancel}
            />
          ) : (
            <Text
              x={x + halfBoxWidth + (halfBoxWidth - gamesBoxWidth) / 2}
              y={y + boxHeight + gamesBoxMarginTop}
              width={gamesBoxWidth}
              height={gamesBoxHeight}
              text={(match.player2?.games || 7).toString()}
              fontSize={gamesFontSize}
              fill={gamesBoxTextColor}
              align="center"
              verticalAlign="middle"
              onDblClick={handleGames2DoubleClick}
            />
          )}
        </Group>
      )}

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
