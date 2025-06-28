import React, { useCallback, useEffect, useRef, useState } from 'react';

import { KonvaEventObject } from 'konva/lib/Node';
import { Stage as KonvaStage } from 'konva/lib/Stage';
import { Group, Line, Rect, Text } from 'react-konva';
import { Html } from 'react-konva-utils';

import { Gamer, Match } from '@/domains/tournament';

import {
  boxHeight,
  boxWidth,
  defaultStrokeWidth,
  disabledColor,
  disabledTextColor,
  editableEmptyGamerBoxBackgroundColor,
  editingIndicatorBackgroundColor,
  editingIndicatorBorderColor,
  editingTextColor,
  EditMode,
  emptyGamerBoxBackgroundColor,
  emptyGamerBoxStrokeColor,
  emptySlotColor,
  gamerBoxBackgroundColor,
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
import { GamerEditState } from './interfaces';

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
  gamerEditState: GamerEditState;
  onGamerClick: (matchId: string, gamer: Gamer) => void;
  onGamerDoubleClick: (gamer: Gamer) => void;
  onConfirmEdit: (newValue: string) => void;
  onCancelEdit: () => void;
  onGamesEdit?: (gamerId: number, newGames: number) => void;
}

interface GamerTextEditorProps {
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

const GamerTextEditor: React.FC<GamerTextEditorProps> = ({ initialValue, x, y, width, height, onConfirm, onCancel }) => {
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
            fontSize: `${Math.min(gamerNameFontSize + 2, 20)}px`,
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

    // 添加 onBlur 事件處理，與 GamerTextEditor 保持一致
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
  gamerEditState,
  onGamerClick,
  onGamerDoubleClick,
  onConfirmEdit,
  onCancelEdit,
  onGamesEdit,
}) => {
  const [editingGames, setEditingGames] = useState<{ gamerId: number; side: 'left' | 'right' } | null>(null);

  const canMatchProceed = match.round === 1 || (match.gamer1 !== null && match.gamer2 !== null);
  const isGamer1Empty = !match.gamer1 || !match.gamer1.name || match.gamer1.name.trim() === '';
  const isGamer2Empty = !match.gamer2 || !match.gamer2.name || match.gamer2.name.trim() === '';
  const canClickGamer1 = !isGamer1Empty && canMatchProceed && editMode !== EditMode.GAMER_EDIT;
  const canClickGamer2 = !isGamer2Empty && canMatchProceed && editMode !== EditMode.GAMER_EDIT;

  const handleGamer1Click = useCallback(() => {
    if (editMode === EditMode.GAMER_EDIT) return;
    if (!isGamer1Empty && canClickGamer1 && match.gamer1) {
      onGamerClick(match.id, match.gamer1);
    }
  }, [match.id, match.gamer1, onGamerClick, canClickGamer1, editMode, isGamer1Empty]);

  const handleGamer2Click = useCallback(() => {
    if (editMode === EditMode.GAMER_EDIT) return;
    if (!isGamer2Empty && canClickGamer2 && match.gamer2) {
      onGamerClick(match.id, match.gamer2);
    }
  }, [match.id, match.gamer2, onGamerClick, canClickGamer2, editMode, isGamer2Empty]);

  const handleGamer1DoubleClick = useCallback(() => {
    if (editMode === EditMode.GAMER_EDIT) {
      const gamerToEdit = match.gamer1 || {
        id: -Math.abs(parseInt(match.id) * 10 + 1),
        name: '',
        games: 7,
      };
      onGamerDoubleClick(gamerToEdit);
    }
  }, [match.gamer1, match.id, onGamerDoubleClick, editMode]);

  const handleGamer2DoubleClick = useCallback(() => {
    if (editMode === EditMode.GAMER_EDIT) {
      const gamerToEdit = match.gamer2 || {
        id: -Math.abs(parseInt(match.id) * 10 + 2),
        name: '',
        games: 7,
      };
      onGamerDoubleClick(gamerToEdit);
    }
  }, [match.gamer2, match.id, onGamerDoubleClick, editMode]);

  const handleGames1DoubleClick = useCallback(() => {
    if (editMode === EditMode.GAMER_EDIT && match.gamer1 && onGamesEdit) {
      setEditingGames({ gamerId: match.gamer1.id, side: 'left' });
    }
  }, [editMode, match.gamer1, onGamesEdit]);

  const handleGames2DoubleClick = useCallback(() => {
    if (editMode === EditMode.GAMER_EDIT && match.gamer2 && onGamesEdit) {
      setEditingGames({ gamerId: match.gamer2.id, side: 'right' });
    }
  }, [editMode, match.gamer2, onGamesEdit]);

  const handleGamesConfirm = useCallback(
    (newGames: number) => {
      if (editingGames && onGamesEdit) {
        onGamesEdit(editingGames.gamerId, newGames);
      }
      setEditingGames(null);
    },
    [editingGames, onGamesEdit]
  );

  const handleGamesCancel = useCallback(() => {
    setEditingGames(null);
  }, []);

  const isEditingGamer1 =
    gamerEditState.isEditing &&
    ((match.gamer1 !== null && gamerEditState.gamerId === match.gamer1.id) ||
      gamerEditState.gamerId === -Math.abs(parseInt(match.id) * 10 + 1));
  const isEditingGamer2 =
    gamerEditState.isEditing &&
    ((match.gamer2 !== null && gamerEditState.gamerId === match.gamer2.id) ||
      gamerEditState.gamerId === -Math.abs(parseInt(match.id) * 10 + 2));

  const isEditingGames1 = editingGames?.side === 'left';
  const isEditingGames2 = editingGames?.side === 'right';

  const getGamerBoxStyle = (gamer: Gamer | null, isWinner: boolean, canClick: boolean, isEmpty: boolean) => {
    if (isEmpty && editMode !== EditMode.GAMER_EDIT) {
      return {
        fill: emptyGamerBoxBackgroundColor,
        stroke: emptyGamerBoxStrokeColor,
        strokeWidth: defaultStrokeWidth,
        cursor: 'default',
      };
    }

    if (!gamer) {
      return {
        fill: emptySlotColor,
        stroke: strokeColor,
        strokeWidth: defaultStrokeWidth,
        cursor: 'default',
      };
    }

    if (editMode === EditMode.GAMER_EDIT) {
      if (isEmpty) {
        return {
          fill: editableEmptyGamerBoxBackgroundColor,
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
        fill: gamerBoxBackgroundColor,
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
      fill: gamerBoxBackgroundColor,
      stroke: strokeColor,
      strokeWidth: defaultStrokeWidth,
      cursor: 'pointer',
    };
  };

  const getTextStyle = (gamer: Gamer | null, canClick: boolean, isEmpty: boolean) => {
    if (isEmpty) {
      if (editMode === EditMode.GAMER_EDIT) {
        return {
          fill: disabledTextColor,
          text: gamer?.name || '空籤',
        };
      }
      return {
        fill: disabledTextColor,
        text: '空籤',
      };
    }

    if (!gamer) {
      return {
        fill: disabledTextColor,
        text: '待定',
      };
    }

    if (editMode === EditMode.GAMER_EDIT) {
      return {
        fill: textColor,
        text: gamer.name,
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

  const gamer1Style = getGamerBoxStyle(
    match.gamer1,
    !!(match.winner && match.gamer1 && match.winner.id === match.gamer1.id),
    canClickGamer1,
    isGamer1Empty
  );
  const gamer2Style = getGamerBoxStyle(
    match.gamer2,
    !!(match.winner && match.gamer2 && match.winner.id === match.gamer2.id),
    canClickGamer2,
    isGamer2Empty
  );
  const gamer1TextStyle = getTextStyle(match.gamer1, canClickGamer1, isGamer1Empty);
  const gamer2TextStyle = getTextStyle(match.gamer2, canClickGamer2, isGamer2Empty);

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
        fill={gamer1Style.fill}
        stroke="transparent"
        strokeWidth={0}
        onClick={(e: KonvaEventObject<MouseEvent>) => {
          if (gamerEditState.isEditing) {
            e.evt.stopPropagation();
            return;
          }
          if (editMode !== EditMode.GAMER_EDIT && isGamer1Empty) {
            return;
          }
          handleGamer1Click();
        }}
        onDblClick={(e: KonvaEventObject<MouseEvent>) => {
          if (editMode === EditMode.GAMER_EDIT) {
            e.evt.preventDefault();
            e.evt.stopPropagation();
            handleGamer1DoubleClick();
          }
        }}
        onTap={handleGamer1Click}
        onMouseEnter={(e: KonvaEventObject<MouseEvent>) => handleMouseEnter(e, gamer1Style.cursor)}
        onMouseLeave={handleMouseLeave}
      />

      {isEditingGamer1 && (
        <GamerTextEditor
          initialValue={gamerEditState.tempName}
          x={x}
          y={y}
          width={halfBoxWidth}
          height={boxHeight}
          onConfirm={onConfirmEdit}
          onCancel={onCancelEdit}
        />
      )}

      {!isEditingGamer1 &&
        Array.from(gamer1TextStyle.text).map((text: string, index: number) => (
          <Text
            key={`gamer1-${index}`}
            x={x}
            y={y + boxHeight / 4 + index * (gamerNameFontSize + 2)}
            text={text}
            fontSize={gamerNameFontSize}
            fill={gamer1TextStyle.fill}
            width={halfBoxWidth}
            onClick={(e: KonvaEventObject<MouseEvent>) => {
              if (editMode === EditMode.GAMER_EDIT) {
                e.evt.stopPropagation();
                return;
              }
              if (!isGamer1Empty) {
                handleGamer1Click();
              }
            }}
            onDblClick={(e: KonvaEventObject<MouseEvent>) => {
              if (editMode === EditMode.GAMER_EDIT) {
                e.evt.preventDefault();
                e.evt.stopPropagation();
                handleGamer1DoubleClick();
              }
            }}
            onTap={() => {
              if (editMode === EditMode.GAMER_EDIT) {
                return;
              }
              if (!isGamer1Empty) {
                handleGamer1Click();
              }
            }}
            ellipsis
            wrap="none"
            align="center"
            verticalAlign="middle"
            listening={editMode === EditMode.GAMER_EDIT}
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
        fill={gamer2Style.fill}
        stroke="transparent"
        strokeWidth={0}
        onClick={(e: KonvaEventObject<MouseEvent>) => {
          if (gamerEditState.isEditing) {
            e.evt.stopPropagation();
            return;
          }
          if (editMode !== EditMode.GAMER_EDIT && isGamer2Empty) {
            return;
          }
          handleGamer2Click();
        }}
        onDblClick={(e: KonvaEventObject<MouseEvent>) => {
          if (editMode === EditMode.GAMER_EDIT) {
            e.evt.preventDefault();
            e.evt.stopPropagation();
            handleGamer2DoubleClick();
          }
        }}
        onTap={handleGamer2Click}
        onMouseEnter={(e: KonvaEventObject<MouseEvent>) => handleMouseEnter(e, gamer2Style.cursor)}
        onMouseLeave={handleMouseLeave}
      />

      {isEditingGamer2 && (
        <GamerTextEditor
          initialValue={gamerEditState.tempName}
          x={x + halfBoxWidth}
          y={y}
          width={halfBoxWidth}
          height={boxHeight}
          onConfirm={onConfirmEdit}
          onCancel={onCancelEdit}
        />
      )}

      {!isEditingGamer2 &&
        Array.from(gamer2TextStyle.text).map((text: string, index: number) => (
          <Text
            key={`gamer2-${index}`}
            x={x + halfBoxWidth}
            y={y + boxHeight / 4 + index * (gamerNameFontSize + 2)}
            text={text}
            fontSize={gamerNameFontSize}
            fill={gamer2TextStyle.fill}
            width={halfBoxWidth}
            onClick={(e: KonvaEventObject<MouseEvent>) => {
              if (editMode === EditMode.GAMER_EDIT) {
                e.evt.stopPropagation();
                return;
              }
              if (!isGamer2Empty) {
                handleGamer2Click();
              }
            }}
            onDblClick={(e: KonvaEventObject<MouseEvent>) => {
              if (editMode === EditMode.GAMER_EDIT) {
                e.evt.preventDefault();
                e.evt.stopPropagation();
                handleGamer2DoubleClick();
              }
            }}
            onTap={() => {
              if (editMode === EditMode.GAMER_EDIT) {
                return;
              }
              if (!isGamer2Empty) {
                handleGamer2Click();
              }
            }}
            ellipsis
            wrap="none"
            align="center"
            verticalAlign="middle"
            listening={editMode === EditMode.GAMER_EDIT}
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
            fill={editMode === EditMode.GAMER_EDIT ? editableGamesBoxBackgroundColor : gamesBoxBackgroundColor}
            stroke={gamesBoxBorderColor}
            strokeWidth={1}
            cornerRadius={4}
            onDblClick={handleGames1DoubleClick}
            onMouseEnter={(e: KonvaEventObject<MouseEvent>) =>
              handleMouseEnter(e, editMode === EditMode.GAMER_EDIT ? 'text' : 'default')
            }
            onMouseLeave={handleMouseLeave}
          />

          {isEditingGames1 && match.gamer1 ? (
            <GamesEditor
              initialValue={match.gamer1.games || 7}
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
              text={(match.gamer1?.games || 7).toString()}
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
            fill={editMode === EditMode.GAMER_EDIT ? editableGamesBoxBackgroundColor : gamesBoxBackgroundColor}
            stroke={gamesBoxBorderColor}
            strokeWidth={1}
            cornerRadius={4}
            onDblClick={handleGames2DoubleClick}
            onMouseEnter={(e: KonvaEventObject<MouseEvent>) =>
              handleMouseEnter(e, editMode === EditMode.GAMER_EDIT ? 'text' : 'default')
            }
            onMouseLeave={handleMouseLeave}
          />

          {isEditingGames2 && match.gamer2 ? (
            <GamesEditor
              initialValue={match.gamer2.games || 7}
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
              text={(match.gamer2?.games || 7).toString()}
              fontSize={gamesFontSize}
              fill={gamesBoxTextColor}
              align="center"
              verticalAlign="middle"
              onDblClick={handleGames2DoubleClick}
            />
          )}
        </Group>
      )}

      {match.winner && match.gamer1 && match.winner.id === match.gamer1.id && (
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

      {match.winner && match.gamer2 && match.winner.id === match.gamer2.id && (
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
