import React, { useCallback, useRef, useState } from 'react';

import { Handle, Position } from '@xyflow/react';

import { Gamer } from '@/domains/tournament';

import { MatchNodeData } from './reactFlowTypes';

interface EditState {
  isEditing: boolean;
  gamerId: number | null;
  field: 'name' | 'games';
  initialValue: string | number;
}

const EditableMatchNode: React.FC<{ data: MatchNodeData; id: string }> = ({ data, id }) => {
  const [editState, setEditState] = useState<EditState>({
    isEditing: false,
    gamerId: null,
    field: 'name',
    initialValue: '',
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const match = data.match;
  const onGamerClick = data.onGamerClick;
  const editMode = data.editMode;
  const onGamerNameEdit = data.onGamerNameEdit;
  const onGamerGamesEdit = data.onGamerGamesEdit;

  const getCursorClass = useCallback(
    (gamer: Gamer | null, isEmpty: boolean) => {
      if (editMode === 'GAMER_EDIT') return 'cursor-text';
      if (isEmpty) return 'cursor-default';
      return gamer ? 'cursor-pointer' : 'cursor-not-allowed';
    },
    [editMode]
  );

  const handleDoubleClick = useCallback(
    (gamer: Gamer | null, field: 'name' | 'games', e: React.MouseEvent) => {
      if (editMode !== 'GAMER_EDIT' || !gamer) return;

      e.preventDefault();
      e.stopPropagation();

      const gamerId = gamer.id || -Math.abs(parseInt(match.id?.replace(/\D/g, '') || '0') * 10 + (field === 'name' ? 1 : 2));
      const initialValue = field === 'name' ? gamer.name || '' : gamer.games || 7;

      setEditState({
        isEditing: true,
        gamerId,
        field,
        initialValue,
      });
    },
    [editMode, match.id]
  );

  const handleEditConfirm = useCallback(
    (value: string) => {
      if (!editState.isEditing || editState.gamerId === null) return;

      if (editState.field === 'name' && onGamerNameEdit) {
        const trimmedValue = value.trim();
        if (trimmedValue.length > 0) {
          onGamerNameEdit(editState.gamerId, trimmedValue);
        }
      } else if (editState.field === 'games' && onGamerGamesEdit) {
        const numValue = parseInt(value) || 7;
        onGamerGamesEdit(editState.gamerId, Math.max(1, Math.min(99, numValue)));
      }

      setEditState({
        isEditing: false,
        gamerId: null,
        field: 'name',
        initialValue: '',
      });
    },
    [editState, onGamerNameEdit, onGamerGamesEdit]
  );

  const handleEditCancel = useCallback(() => {
    setEditState({
      isEditing: false,
      gamerId: null,
      field: 'name',
      initialValue: '',
    });
  }, []);

  const handleGamerClick = useCallback(
    (gamer: Gamer | null) => {
      if (editMode === 'GAMER_EDIT' || !gamer || editState.isEditing) return;

      const isEmpty = !gamer.name || gamer.name.trim() === '';
      if (isEmpty) return;

      onGamerClick(match.id || '', gamer);
    },
    [editMode, editState.isEditing, onGamerClick, match.id]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        handleEditConfirm(e.currentTarget.value);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleEditCancel();
      }
    },
    [handleEditConfirm, handleEditCancel]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      handleEditConfirm(e.target.value);
    },
    [handleEditConfirm]
  );

  if (!match) {
    return (
      <div className="w-24 h-20 bg-gray-100 border border-gray-300 flex items-center justify-center text-xs text-gray-500">
        No Match Data
      </div>
    );
  }

  const gamer1 = match.gamer1;
  const gamer2 = match.gamer2;
  const winner = match.winner;
  const round = match.round || 1;

  const gamer1Name = gamer1?.name;
  const gamer2Name = gamer2?.name;
  const gamer1Games = gamer1?.games || 7;
  const gamer2Games = gamer2?.games || 7;
  const gamer1Id = gamer1?.id;
  const gamer2Id = gamer2?.id;
  const winnerId = winner?.id;

  const isGamer1Empty = !gamer1Name || gamer1Name.trim() === '';
  const isGamer2Empty = !gamer2Name || gamer2Name.trim() === '';
  const isGamer1Winner = !!(winnerId && gamer1Id && winnerId === gamer1Id);
  const isGamer2Winner = !!(winnerId && gamer2Id && winnerId === gamer2Id);

  return (
    <div className="w-24 h-20 relative">
      {/* 修正：第一輪不需要 target handle */}
      {match.round > 1 && (
        <Handle
          type="target"
          position={Position.Bottom}
          id={`${id}-target`}
          style={{
            opacity: 0,
            width: 8,
            height: 8,
            border: 'none',
            background: 'transparent',
            bottom: -4,
          }}
        />
      )}

      {/* 修正：所有比賽都需要 source handle，包括決賽（連接到冠軍） */}
      <Handle
        type="source"
        position={Position.Top}
        id={`${id}-source`}
        style={{
          opacity: 0,
          width: 8,
          height: 8,
          border: 'none',
          background: 'transparent',
          top: -4,
        }}
      />

      <div className="flex h-20 w-24 border border-gray-300 dark:border-gray-600 rounded shadow-sm overflow-hidden bg-white dark:bg-gray-800">
        <div
          className={`flex-1 h-full flex items-center justify-center text-sm font-medium px-1 border-r border-gray-300 dark:border-gray-600 ${getCursorClass(gamer1, isGamer1Empty)} ${
            isGamer1Winner
              ? 'bg-yellow-100 dark:bg-yellow-900 border-orange-400'
              : isGamer1Empty && editMode !== 'GAMER_EDIT'
                ? 'text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700'
                : editState.isEditing && editState.gamerId === gamer1Id
                  ? 'bg-blue-50 dark:bg-blue-900 border-blue-200'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          }`}
          onClick={() => handleGamerClick(gamer1)}
          onDoubleClick={(e) => handleDoubleClick(gamer1, 'name', e)}
        >
          {editState.isEditing && editState.gamerId === gamer1Id && editState.field === 'name' ? (
            <input
              ref={inputRef}
              type="text"
              defaultValue={editState.initialValue.toString()}
              maxLength={8}
              placeholder="輸入名稱"
              className="w-full h-full text-center border-2 border-blue-500 rounded bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-100 font-bold outline-none px-1"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              autoFocus
            />
          ) : (
            <span className="truncate text-center text-xs">{gamer1Name || (isGamer1Empty ? '空籤' : '待定')}</span>
          )}
        </div>

        <div
          className={`flex-1 h-full flex items-center justify-center text-sm font-medium px-1 ${getCursorClass(gamer2, isGamer2Empty)} ${
            isGamer2Winner
              ? 'bg-yellow-100 dark:bg-yellow-900 border-orange-400'
              : isGamer2Empty && editMode !== 'GAMER_EDIT'
                ? 'text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700'
                : editState.isEditing && editState.gamerId === gamer2Id
                  ? 'bg-blue-50 dark:bg-blue-900 border-blue-200'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
          }`}
          onClick={() => handleGamerClick(gamer2)}
          onDoubleClick={(e) => handleDoubleClick(gamer2, 'name', e)}
        >
          {editState.isEditing && editState.gamerId === gamer2Id && editState.field === 'name' ? (
            <input
              ref={inputRef}
              type="text"
              defaultValue={editState.initialValue.toString()}
              maxLength={8}
              placeholder="輸入名稱"
              className="w-full h-full text-center border-2 border-blue-500 rounded bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-100 font-bold outline-none px-1"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              autoFocus
            />
          ) : (
            <span className="truncate text-center text-xs">{gamer2Name || (isGamer2Empty ? '空籤' : '待定')}</span>
          )}
        </div>
      </div>

      {round === 1 && (
        <div className="flex justify-between mt-1 px-1 space-x-1">
          <div
            className={`w-10 h-6 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs flex items-center justify-center ${
              editMode === 'GAMER_EDIT' ? 'cursor-text bg-white dark:bg-gray-600 border-blue-400' : 'cursor-default'
            }`}
            onDoubleClick={(e) => handleDoubleClick(gamer1, 'games', e)}
          >
            {editState.isEditing && editState.gamerId === gamer1Id && editState.field === 'games' ? (
              <input
                ref={inputRef}
                type="number"
                min="1"
                max="99"
                defaultValue={editState.initialValue.toString()}
                className="w-full h-full text-center border-2 border-blue-500 rounded bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-100 font-bold outline-none text-xs"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                autoFocus
              />
            ) : (
              <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{gamer1Games}</span>
            )}
          </div>

          <div
            className={`w-10 h-6 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs flex items-center justify-center ${
              editMode === 'GAMER_EDIT' ? 'cursor-text bg-white dark:bg-gray-600 border-blue-400' : 'cursor-default'
            }`}
            onDoubleClick={(e) => handleDoubleClick(gamer2, 'games', e)}
          >
            {editState.isEditing && editState.gamerId === gamer2Id && editState.field === 'games' ? (
              <input
                ref={inputRef}
                type="number"
                min="1"
                max="99"
                defaultValue={editState.initialValue.toString()}
                className="w-full h-full text-center border-2 border-blue-500 rounded bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-100 font-bold outline-none text-xs"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                autoFocus
              />
            ) : (
              <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{gamer2Games}</span>
            )}
          </div>
        </div>
      )}

      {round > 1 && (!gamer1 || !gamer2) && <div className="absolute top-1 right-1 text-xs opacity-60">🔒</div>}

      {isGamer1Winner && (
        <div className="absolute top-0 left-0 w-12 h-20 border-2 border-orange-500 rounded-l pointer-events-none" />
      )}
      {isGamer2Winner && (
        <div className="absolute top-0 right-0 w-12 h-20 border-2 border-orange-500 rounded-r pointer-events-none" />
      )}
    </div>
  );
};

export default EditableMatchNode;
