import { useState } from 'react';

import { Button } from '../buttons/Button';
import { Input } from '../inputs/Input';

interface DraggableTagProps {
  text: string;
  index: number;
  onRemove?: () => void;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (targetIndex: number) => void;
  onTextChange: (index: number, newText: string) => void;
  isDragging: boolean;
  isDropTarget: boolean;
}

const DraggableTag = ({
  text,
  index,
  onRemove,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onTextChange,
  isDragging,
  isDropTarget,
}: DraggableTagProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(text);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    onDragStart(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(index);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovered(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsHovered(false);
    }
  };

  const handleDoubleClick = () => {
    if (!isDragging) {
      setIsEditing(true);
      setEditValue(text);
    }
  };

  const handleEditSubmit = () => {
    if (editValue.trim() && editValue.trim() !== text) {
      onTextChange(index, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditValue(text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  return (
    <div
      draggable={!isEditing}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDoubleClick={handleDoubleClick}
      className={`
        flex items-center gap-2 p-3 rounded border cursor-move select-none
        transition-all duration-200 ease-in-out
        ${isDragging ? 'opacity-30 scale-95 bg-link' : 'opacity-100 scale-100 bg-background hover:bg-backgroundLight'}
        ${isDropTarget && isHovered ? 'border-blue-400 border-2 bg-blue-50' : 'border-gray-200'}
        ${!isDragging ? 'hover:shadow-md' : ''}
      `}
    >
      <div className="cursor-move">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <circle cx="3" cy="3" r="1" />
          <circle cx="9" cy="3" r="1" />
          <circle cx="3" cy="6" r="1" />
          <circle cx="9" cy="6" r="1" />
          <circle cx="3" cy="9" r="1" />
          <circle cx="9" cy="9" r="1" />
        </svg>
      </div>

      {isEditing ? (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleEditSubmit}
          onKeyDown={handleKeyDown}
          className="flex-1 text-sm text-foreground bg-transparent border-none outline-none"
          autoFocus
        />
      ) : (
        <span className="flex-1 text-sm text-foreground">{text}</span>
      )}

      {onRemove && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onRemove();
          }}
          className="text-red-400 hover:text-red-600 transition-colors text-lg leading-none"
          title="移除此項目"
          element="×"
        />
      )}
    </div>
  );
};

export default DraggableTag;
