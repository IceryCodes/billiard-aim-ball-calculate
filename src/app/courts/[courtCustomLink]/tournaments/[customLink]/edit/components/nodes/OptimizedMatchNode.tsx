import React, { useCallback, useMemo, useState } from 'react';

import { Handle, NodeToolbar, Position } from '@xyflow/react';

import { Gamer } from '@/domains/tournament';

import { DOT_STYLE, getThemedStyles } from '../darkModeConstants';
import { LAYOUT } from '../reactFlowConstants';
import { MatchNodeData } from '../reactFlowTypes';
import { canMatchProceed, getCursorClass, isGamerEmpty } from '../reactFlowUtils';

const OptimizedMatchNode: React.FC<{ data: MatchNodeData; selected?: boolean; id: string }> = React.memo(
  ({ data, selected, id }) => {
    const { match, isEditMode, onGamerClick, onGamesEdit, editMode, isDrawingMode } = data;

    const [editingGamer, setEditingGamer] = useState<'gamer1' | 'gamer2' | null>(null);
    const [editingGames, setEditingGames] = useState<{ gamerId: number; side: 'left' | 'right' } | null>(null);
    const [gamer1Name, setGamer1Name] = useState(match.gamer1?.name || '');
    const [gamer2Name, setGamer2Name] = useState(match.gamer2?.name || '');

    // 使用 useMemo 優化樣式計算
    const themedStyles = useMemo(() => getThemedStyles(), []);

    const matchCanProceed = useMemo(() => canMatchProceed(match), [match]);
    const isGamer1Empty = useMemo(() => isGamerEmpty(match.gamer1), [match.gamer1]);
    const isGamer2Empty = useMemo(() => isGamerEmpty(match.gamer2), [match.gamer2]);

    const canClickGamer1 = useMemo(
      () => !isGamer1Empty && matchCanProceed && editMode !== 'GAMER_EDIT',
      [isGamer1Empty, matchCanProceed, editMode]
    );

    const canClickGamer2 = useMemo(
      () => !isGamer2Empty && matchCanProceed && editMode !== 'GAMER_EDIT',
      [isGamer2Empty, matchCanProceed, editMode]
    );

    const handleGamer1Click = useCallback(() => {
      if (isDrawingMode) return;
      if (editMode === 'GAMER_EDIT') return;
      if (!isGamer1Empty && canClickGamer1 && match.gamer1) {
        onGamerClick(match.id, match.gamer1);
      }
    }, [isDrawingMode, match.id, match.gamer1, onGamerClick, canClickGamer1, editMode, isGamer1Empty]);

    const handleGamer2Click = useCallback(() => {
      if (isDrawingMode) return;
      if (editMode === 'GAMER_EDIT') return;
      if (!isGamer2Empty && canClickGamer2 && match.gamer2) {
        onGamerClick(match.id, match.gamer2);
      }
    }, [isDrawingMode, match.id, match.gamer2, onGamerClick, canClickGamer2, editMode, isGamer2Empty]);

    const handleGames1DoubleClick = useCallback(() => {
      if (editMode === 'GAMER_EDIT' && match.gamer1 && onGamesEdit) {
        setEditingGames({ gamerId: match.gamer1.id, side: 'left' });
      }
    }, [editMode, match.gamer1, onGamesEdit]);

    const handleGames2DoubleClick = useCallback(() => {
      if (editMode === 'GAMER_EDIT' && match.gamer2 && onGamesEdit) {
        setEditingGames({ gamerId: match.gamer2.id, side: 'right' });
      }
    }, [editMode, match.gamer2, onGamesEdit]);

    const getGamerText = useCallback(
      (gamer: Gamer | null, isEmpty: boolean): string => {
        if (isEmpty) {
          return editMode === 'GAMER_EDIT' ? gamer?.name || '空籤' : '空籤';
        }
        return gamer?.name || '待定';
      },
      [editMode]
    );

    const getGamerClasses = useCallback(
      (isWinner: boolean, canClick: boolean, isEmpty: boolean, isLeft: boolean, isEditing: boolean): string => {
        const baseClasses = [themedStyles.gamerBox];
        if (isLeft) baseClasses.push(themedStyles.gamerBoxLeft);

        if (isEditing) {
          baseClasses.push(themedStyles.gamerBoxEditable);
        } else if (isEmpty && editMode !== 'GAMER_EDIT') {
          baseClasses.push(themedStyles.gamerBoxEmpty);
        } else if (!canClick && editMode !== 'GAMER_EDIT') {
          baseClasses.push(themedStyles.gamerBoxDisabled);
        } else if (isWinner) {
          baseClasses.push(themedStyles.gamerBoxWinner);
        }

        return baseClasses.join(' ');
      },
      [themedStyles, editMode]
    );

    const gamer1Classes = useMemo(
      () =>
        getGamerClasses(
          !!(match.winner && match.gamer1 && match.winner.id === match.gamer1.id),
          canClickGamer1,
          isGamer1Empty,
          true,
          editingGamer === 'gamer1'
        ),
      [getGamerClasses, match.winner, match.gamer1, canClickGamer1, isGamer1Empty, editingGamer]
    );

    const gamer2Classes = useMemo(
      () =>
        getGamerClasses(
          !!(match.winner && match.gamer2 && match.winner.id === match.gamer2.id),
          canClickGamer2,
          isGamer2Empty,
          false,
          editingGamer === 'gamer2'
        ),
      [getGamerClasses, match.winner, match.gamer2, canClickGamer2, isGamer2Empty, editingGamer]
    );

    return (
      <div
        className="relative"
        style={{
          width: LAYOUT.boxWidth,
          height: LAYOUT.boxHeight + (match.round === 1 ? 35 : 0),
        }}
      >
        {/* React Flow 工具欄 */}
        {selected && isEditMode && editMode === 'GAMER_EDIT' && (
          <NodeToolbar isVisible={selected}>
            <div className="flex gap-2 bg-white dark:bg-gray-800 p-2 rounded shadow-lg border border-gray-300 dark:border-gray-600">
              <button
                className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                onClick={() => setEditingGamer(editingGamer === 'gamer1' ? null : 'gamer1')}
              >
                {editingGamer === 'gamer1' ? '完成' : '編輯左選手'}
              </button>
              <button
                className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                onClick={() => setEditingGamer(editingGamer === 'gamer2' ? null : 'gamer2')}
              >
                {editingGamer === 'gamer2' ? '完成' : '編輯右選手'}
              </button>
            </div>
          </NodeToolbar>
        )}

        {/* React Flow 連接點 - 極小的圈圈 */}
        {match.round > 1 && <Handle type="target" position={Position.Bottom} id={`${id}-target`} style={DOT_STYLE} />}

        <Handle type="source" position={Position.Top} id={`${id}-source`} style={DOT_STYLE} />

        {/* 其餘組件內容保持不變... */}
        <div
          className={`${themedStyles.matchNode} w-full flex relative transition-colors duration-200`}
          style={{ height: LAYOUT.boxHeight }}
        >
          {/* 左側選手 */}
          <div
            className={`${gamer1Classes} ${getCursorClass(canClickGamer1, isGamer1Empty, editMode)} w-1/2 transition-colors duration-200`}
            onClick={handleGamer1Click}
          >
            {editingGamer === 'gamer1' ? (
              <input
                type="text"
                value={gamer1Name}
                onChange={(e) => setGamer1Name(e.target.value)}
                onBlur={() => setEditingGamer(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setEditingGamer(null);
                  } else if (e.key === 'Escape') {
                    setGamer1Name(match.gamer1?.name || '');
                    setEditingGamer(null);
                  }
                }}
                autoFocus
                maxLength={8}
                className={themedStyles.editInputFocused}
                placeholder="輸入名稱"
              />
            ) : (
              <span className={themedStyles.gamerText} style={{ writingMode: 'vertical-rl' }}>
                {getGamerText(match.gamer1, isGamer1Empty)}
              </span>
            )}
          </div>

          {/* 右側選手 */}
          <div
            className={`${gamer2Classes} ${getCursorClass(canClickGamer2, isGamer2Empty, editMode)} w-1/2 transition-colors duration-200`}
            onClick={handleGamer2Click}
          >
            {editingGamer === 'gamer2' ? (
              <input
                type="text"
                value={gamer2Name}
                onChange={(e) => setGamer2Name(e.target.value)}
                onBlur={() => setEditingGamer(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setEditingGamer(null);
                  } else if (e.key === 'Escape') {
                    setGamer2Name(match.gamer2?.name || '');
                    setEditingGamer(null);
                  }
                }}
                autoFocus
                maxLength={8}
                className={themedStyles.editInputFocused}
                placeholder="輸入名稱"
              />
            ) : (
              <span className={themedStyles.gamerText} style={{ writingMode: 'vertical-rl' }}>
                {getGamerText(match.gamer2, isGamer2Empty)}
              </span>
            )}
          </div>

          {/* 鎖定圖標 */}
          {!matchCanProceed && match.round > 1 && <div className="absolute top-1 right-1 text-xs opacity-60">🔒</div>}

          {/* 勝者標記 */}
          {match.winner && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border border-orange-500 animate-pulse">
              <span className="text-xs">🏆</span>
            </div>
          )}
        </div>

        {/* 遊戲局數框 - 只在第一輪顯示 */}
        {match.round === 1 && (
          <div className="absolute top-full mt-1 w-full flex justify-between px-6">
            {/* 左側選手遊戲局數 */}
            <div
              className={`${editingGames?.side === 'left' ? themedStyles.gamesBoxEdit : themedStyles.gamesBox} ${
                editMode === 'GAMER_EDIT' ? 'cursor-text' : 'cursor-default'
              } transition-colors duration-200`}
              onDoubleClick={handleGames1DoubleClick}
            >
              {editingGames?.side === 'left' ? (
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={match.gamer1?.games || 7}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 7;
                    if (onGamesEdit && match.gamer1) {
                      onGamesEdit(match.gamer1.id, Math.max(1, Math.min(99, value)));
                    }
                  }}
                  onBlur={() => setEditingGames(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      setEditingGames(null);
                    }
                  }}
                  autoFocus
                  className="w-full h-full text-center border-0 bg-transparent outline-none text-xs"
                />
              ) : (
                <span>{match.gamer1?.games || 7}</span>
              )}
            </div>

            {/* 右側選手遊戲局數 */}
            <div
              className={`${editingGames?.side === 'right' ? themedStyles.gamesBoxEdit : themedStyles.gamesBox} ${
                editMode === 'GAMER_EDIT' ? 'cursor-text' : 'cursor-default'
              } transition-colors duration-200`}
              onDoubleClick={handleGames2DoubleClick}
            >
              {editingGames?.side === 'right' ? (
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={match.gamer2?.games || 7}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 7;
                    if (onGamesEdit && match.gamer2) {
                      onGamesEdit(match.gamer2.id, Math.max(1, Math.min(99, value)));
                    }
                  }}
                  onBlur={() => setEditingGames(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') {
                      setEditingGames(null);
                    }
                  }}
                  autoFocus
                  className="w-full h-full text-center border-0 bg-transparent outline-none text-xs"
                />
              ) : (
                <span>{match.gamer2?.games || 7}</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

OptimizedMatchNode.displayName = 'OptimizedMatchNode';
export default OptimizedMatchNode;
