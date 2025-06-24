import React, { useCallback, useEffect } from 'react';

import { Group, Line, Rect, Text } from 'react-konva';

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

  // 判斷是否為空籤（選手姓名為空或null）
  const isPlayer1Empty = !match.player1 || !match.player1.name || match.player1.name.trim() === '';
  const isPlayer2Empty = !match.player2 || !match.player2.name || match.player2.name.trim() === '';

  // 在非編輯模式下，空籤不能點擊
  const canClickPlayer1 = !isPlayer1Empty && canMatchProceed && editMode !== EditMode.PLAYER_EDIT;
  const canClickPlayer2 = !isPlayer2Empty && canMatchProceed && editMode !== EditMode.PLAYER_EDIT;

  // 修正後的選手1單擊處理
  const handlePlayer1Click = useCallback(() => {
    if (editMode === EditMode.PLAYER_EDIT) {
      // 在編輯模式下，單擊不應該觸發選擇獲勝者
      return;
    }

    // 空籤不能被選為獲勝者
    if (!isPlayer1Empty && canClickPlayer1 && match.player1) {
      onPlayerClick(match.id, match.player1);
    }
  }, [match.id, match.player1, onPlayerClick, canClickPlayer1, editMode, isPlayer1Empty]);

  // 修正後的選手2單擊處理
  const handlePlayer2Click = useCallback(() => {
    if (editMode === EditMode.PLAYER_EDIT) {
      // 在編輯模式下，單擊不應該觸發選擇獲勝者
      return;
    }

    // 空籤不能被選為獲勝者
    if (!isPlayer2Empty && canClickPlayer2 && match.player2) {
      onPlayerClick(match.id, match.player2);
    }
  }, [match.id, match.player2, onPlayerClick, canClickPlayer2, editMode, isPlayer2Empty]);

  // 修正後的選手1雙擊處理
  const handlePlayer1DoubleClick = useCallback(() => {
    // 只有在編輯模式下才能雙擊編輯（包括空籤）
    if (editMode === EditMode.PLAYER_EDIT) {
      // 如果是空籤，創建一個臨時的 player 物件來編輯
      // 使用負數作為臨時 ID，避免與正常 ID 衝突
      const playerToEdit = match.player1 || {
        id: -Math.abs(parseInt(match.id) * 10 + 1),
        name: '',
      };
      onPlayerDoubleClick(playerToEdit);
    }
  }, [match.player1, match.id, onPlayerDoubleClick, editMode]);

  // 修正後的選手2雙擊處理
  const handlePlayer2DoubleClick = useCallback(() => {
    // 只有在編輯模式下才能雙擊編輯（包括空籤）
    if (editMode === EditMode.PLAYER_EDIT) {
      // 如果是空籤，創建一個臨時的 player 物件來編輯
      // 使用負數作為臨時 ID，避免與正常 ID 衝突
      const playerToEdit = match.player2 || {
        id: -Math.abs(parseInt(match.id) * 10 + 2),
        name: '',
      };
      onPlayerDoubleClick(playerToEdit);
    }
  }, [match.player2, match.id, onPlayerDoubleClick, editMode]);

  // 判斷是否在編輯狀態
  const isEditingPlayer1 =
    playerEditState.isEditing &&
    ((match.player1 !== null && playerEditState.playerId === match.player1.id) ||
      playerEditState.playerId === -Math.abs(parseInt(match.id) * 10 + 1));
  const isEditingPlayer2 =
    playerEditState.isEditing &&
    ((match.player2 !== null && playerEditState.playerId === match.player2.id) ||
      playerEditState.playerId === -Math.abs(parseInt(match.id) * 10 + 2));

  // 渲染編輯中的視覺提示
  const renderEditingIndicator = (inputX: number, inputY: number, width: number) => {
    const tempName = playerEditState.tempName || '';
    const displayText = tempName;

    return (
      <Group>
        <Rect
          x={inputX}
          y={inputY}
          width={width}
          height={boxHeight}
          fill={editingIndicatorBackgroundColor}
          stroke={editingIndicatorBorderColor}
          strokeWidth={2}
          cornerRadius={2}
        />

        {/* 當前輸入的文字 - 顯示為直向 */}
        {Array.from(displayText).map((char: string, index: number) => (
          <Text
            key={`edit-${index}`}
            x={inputX}
            y={inputY + boxHeight / 4 + index * (playerNameFontSize + 2)}
            text={char === ' ' ? '·' : char} // 空格顯示為中點
            fontSize={playerNameFontSize}
            fill={editingTextColor}
            width={width}
            align="center"
            fontStyle="bold"
          />
        ))}

        {/* 游標指示 - 簡化 */}
        <Rect
          x={inputX + width / 2 - 1}
          y={inputY + boxHeight / 4 + displayText.length * (playerNameFontSize + 2)}
          width={2}
          height={playerNameFontSize}
          fill={editingTextColor}
        />
      </Group>
    );
  };

  // 處理鍵盤輸入的效果
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!playerEditState.isEditing) return;

      // 允許 Ctrl+V、Ctrl+C、Ctrl+X、Ctrl+A 等常用組合鍵通過
      if (e.ctrlKey || e.metaKey) {
        // 處理貼上操作
        if (e.key === 'v' || e.key === 'V') {
          // 不阻止預設行為，讓瀏覽器處理貼上
          // 我們會在 paste 事件中處理
          return;
        }
        // 允許其他 Ctrl 組合鍵（複製、剪下、全選等）
        if (['c', 'C', 'x', 'X', 'a', 'A', 'z', 'Z', 'y', 'Y'].includes(e.key)) {
          return;
        }
      }

      // 阻止其他按鍵的預設行為
      e.preventDefault();

      if (e.key === 'Enter') {
        onConfirmEdit();
      } else if (e.key === 'Escape') {
        onCancelEdit();
      } else if (e.key === 'Backspace') {
        onEditStateChange({
          ...playerEditState,
          tempName: playerEditState.tempName.slice(0, -1),
        });
      } else if (e.key === 'Delete') {
        // 支援 Delete 鍵清空
        onEditStateChange({
          ...playerEditState,
          tempName: '',
        });
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // 只處理可見字符，排除組合鍵
        const newName = playerEditState.tempName + e.key;
        // 限制最大長度
        if (newName.length <= 8) {
          onEditStateChange({
            ...playerEditState,
            tempName: newName,
          });
        }
      }
    };

    // 處理貼上事件
    const handlePaste = (e: ClipboardEvent) => {
      if (!playerEditState.isEditing) return;

      e.preventDefault();

      // 獲取剪貼簿內容
      const pastedText = e.clipboardData?.getData('text') || '';

      // 過濾掉不可見字符，只保留可見文字
      const cleanText = pastedText.replace(/[\r\n\t]/g, '').trim();

      if (cleanText) {
        // 將現有文字與貼上的文字合併，但限制總長度
        const newName = (playerEditState.tempName + cleanText).slice(0, 8);
        onEditStateChange({
          ...playerEditState,
          tempName: newName,
        });
      }
    };

    // 處理點擊外部區域自動確認
    const handleClickOutside = (e: MouseEvent) => {
      if (!playerEditState.isEditing) return;

      // 檢查是否點擊在 Konva canvas 外部，或者點擊到其他地方
      const target = e.target as HTMLElement;

      // 如果點擊的不是 canvas 或者是 canvas 但不在編輯的選手框內
      if (target.tagName !== 'CANVAS') {
        onConfirmEdit();
      }
    };

    if (playerEditState.isEditing) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('paste', handlePaste);
      document.addEventListener('mousedown', handleClickOutside);
      // 聚焦到 body 確保能接收鍵盤事件
      document.body.focus();

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('paste', handlePaste);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [playerEditState, onEditStateChange, onConfirmEdit, onCancelEdit]);

  const getPlayerBoxStyle = (player: Player | null, isWinner: boolean, canClick: boolean, isEmpty: boolean) => {
    // 空籤在非編輯模式下顯示為灰色，不能點擊
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

    // 在編輯模式下，所有選手都應該可以編輯，不管是否獲勝
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

    // 非編輯模式的原始邏輯
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
    // 空籤顯示為「空籤」且為灰色文字
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

    // 在編輯模式下，所有選手的文字都應該是可編輯的樣式
    if (editMode === EditMode.PLAYER_EDIT) {
      return {
        fill: textColor,
        text: player.name,
      };
    }

    // 非編輯模式的原始邏輯
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

  return (
    <Group>
      {/* 編輯狀態下的背景點擊區域 - 用於捕捉點擊外部的事件 */}
      {playerEditState.isEditing && (
        <Rect
          x={-1000}
          y={-1000}
          width={2000}
          height={2000}
          fill="transparent"
          onClick={(e) => {
            e.evt.stopPropagation();
            onConfirmEdit();
          }}
          listening={true}
        />
      )}

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
        onClick={(e) => {
          if (playerEditState.isEditing) {
            e.evt.stopPropagation();
            return;
          }
          // 空籤在非編輯模式下不能點擊
          if (editMode !== EditMode.PLAYER_EDIT && isPlayer1Empty) {
            return;
          }
          handlePlayer1Click();
        }}
        onDblClick={(e) => {
          // 只有在編輯模式下才處理雙擊事件
          if (editMode === EditMode.PLAYER_EDIT) {
            e.evt.preventDefault();
            e.evt.stopPropagation();
            handlePlayer1DoubleClick();
          }
        }}
        onTap={() => {
          if (editMode !== EditMode.PLAYER_EDIT && isPlayer1Empty) {
            return;
          }
          handlePlayer1Click();
        }}
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
      {isEditingPlayer1
        ? renderEditingIndicator(x, y, halfBoxWidth)
        : Array.from(player1TextStyle.text).map((text: string, index: number) => (
            <Text
              key={`player1-${index}`}
              x={x}
              y={y + boxHeight / 4 + index * (playerNameFontSize + 2)}
              text={text}
              fontSize={playerNameFontSize}
              fill={player1TextStyle.fill}
              width={halfBoxWidth}
              onClick={(e) => {
                if (editMode === EditMode.PLAYER_EDIT) {
                  e.evt.stopPropagation();
                  return;
                }
                if (!isPlayer1Empty) {
                  handlePlayer1Click();
                }
              }}
              onDblClick={(e) => {
                // 只有在編輯模式下才處理雙擊事件
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
        onClick={(e) => {
          if (playerEditState.isEditing) {
            e.evt.stopPropagation();
            return;
          }
          // 空籤在非編輯模式下不能點擊
          if (editMode !== EditMode.PLAYER_EDIT && isPlayer2Empty) {
            return;
          }
          handlePlayer2Click();
        }}
        onDblClick={(e) => {
          // 只有在編輯模式下才處理雙擊事件
          if (editMode === EditMode.PLAYER_EDIT) {
            e.evt.preventDefault();
            e.evt.stopPropagation();
            handlePlayer2DoubleClick();
          }
        }}
        onTap={() => {
          if (editMode !== EditMode.PLAYER_EDIT && isPlayer2Empty) {
            return;
          }
          handlePlayer2Click();
        }}
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
      {isEditingPlayer2
        ? renderEditingIndicator(x + halfBoxWidth, y, halfBoxWidth)
        : Array.from(player2TextStyle.text).map((text: string, index: number) => (
            <Text
              key={`player2-${index}`}
              x={x + halfBoxWidth}
              y={y + boxHeight / 4 + index * (playerNameFontSize + 2)}
              text={text}
              fontSize={playerNameFontSize}
              fill={player2TextStyle.fill}
              width={halfBoxWidth}
              onClick={(e) => {
                if (editMode === EditMode.PLAYER_EDIT) {
                  e.evt.stopPropagation();
                  return;
                }
                if (!isPlayer2Empty) {
                  handlePlayer2Click();
                }
              }}
              onDblClick={(e) => {
                // 只有在編輯模式下才處理雙擊事件
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
