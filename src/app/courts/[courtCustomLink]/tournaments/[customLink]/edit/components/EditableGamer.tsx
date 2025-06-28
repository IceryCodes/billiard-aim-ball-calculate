import React, { KeyboardEvent, useCallback, useState } from 'react';

import { Input } from '@/global-components/inputs/Input';

import { EditableGamerProps } from './interfaces';

const EditableGamer: React.FC<EditableGamerProps> = ({ gamer, onNameChange, onDragStart, className = '' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(gamer.name);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      onDragStart(gamer);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/json', JSON.stringify(gamer));
    },
    [onDragStart, gamer]
  );

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setTempName(gamer.name);
  }, [gamer.name]);

  const handleNameSubmit = useCallback(() => {
    onNameChange(gamer.id, tempName);
    setIsEditing(false);
  }, [onNameChange, gamer.id, tempName]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleNameSubmit();
      } else if (e.key === 'Escape') {
        setIsEditing(false);
        setTempName(gamer.name);
      }
    },
    [handleNameSubmit, gamer.name]
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
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{gamer.name}</span>
        </div>
      )}
    </div>
  );
};

export default EditableGamer;
