// EditablePlayer.tsx - 可編輯選手組件
import React, { KeyboardEvent, useCallback, useState } from 'react';

import { Input } from '@/global-components/inputs/Input';

import { EditablePlayerProps } from './interfaces';

const EditablePlayer: React.FC<EditablePlayerProps> = ({ player, onNameChange, onDragStart, className = '' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(player.name);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      onDragStart(player);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/json', JSON.stringify(player));
    },
    [onDragStart, player]
  );

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setTempName(player.name);
  }, [player.name]);

  const handleNameSubmit = useCallback(() => {
    onNameChange(player.id, tempName);
    setIsEditing(false);
  }, [onNameChange, player.id, tempName]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleNameSubmit();
      } else if (e.key === 'Escape') {
        setIsEditing(false);
        setTempName(player.name);
      }
    },
    [handleNameSubmit, player.name]
  );

  return (
    <div
      draggable={!isEditing}
      onDragStart={handleDragStart}
      onDoubleClick={handleDoubleClick}
      className={`w-[120px] border border-background cursor-move hover:bg-backgroundLight transition-colors rounded bg-backgroundLight text-foreground ${className}`}
    >
      {isEditing ? (
        <Input
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onBlur={handleNameSubmit}
          onKeyDown={handleKeyPress}
          autoFocus
        />
      ) : (
        <div className="px-4 py-2 flex justify-center items-center">
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{player.name}</span>
        </div>
      )}
    </div>
  );
};

export default EditablePlayer;
