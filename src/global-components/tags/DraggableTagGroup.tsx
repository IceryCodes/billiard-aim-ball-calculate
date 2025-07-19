import { useCallback, useState } from 'react';

import { Button } from '../buttons/Button';

import DraggableTag from './DraggableTag';

interface DraggableTagGroupProps {
  initialTags: string[];
  onConfirm: (finalOrder: string[]) => void;
  onCancel?: () => void;
  allowRemove?: boolean;
}

export const DraggableTagGroup = ({ initialTags, onConfirm, onCancel, allowRemove = true }: DraggableTagGroupProps) => {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (targetIndex: number) => {
      if (draggedIndex === null || draggedIndex === targetIndex) return;

      setTags((prevTags) => {
        const newTags = [...prevTags];
        const draggedItem = newTags[draggedIndex];

        newTags.splice(draggedIndex, 1);

        const insertIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
        newTags.splice(insertIndex, 0, draggedItem);

        return newTags;
      });

      setDraggedIndex(null);
    },
    [draggedIndex]
  );

  const handleRemoveTag = useCallback((indexToRemove: number) => {
    setTags((prevTags) => prevTags.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(tags);
  }, [tags, onConfirm]);

  const handleReset = useCallback(() => {
    setTags(initialTags);
  }, [initialTags]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm">
        <span>拖拉以調整順序 ({tags.length} 個項目)</span>
        <button onClick={handleReset} className="underline">
          重置順序
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto bg-gray-50 p-3 rounded border">
        {tags.length === 0 ? (
          <div className="text-center py-8">沒有項目</div>
        ) : (
          tags.map((tag, index) => (
            <div key={`${tag}-${index}`} className="flex items-center gap-3">
              <span className="text-xs w-6 text-right font-mono text-background">{index + 1}</span>

              <div className="flex-1">
                <DraggableTag
                  text={tag}
                  index={index}
                  onRemove={allowRemove ? () => handleRemoveTag(index) : undefined}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  isDragging={draggedIndex === index}
                  isDropTarget={draggedIndex !== null && draggedIndex !== index}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button
          text={`確定順序 (${tags.length})`}
          onClick={handleConfirm}
          className="flex-1 disabled:opacity-50"
          disabled={tags.length === 0}
        />
        {onCancel && <Button text="取消" onClick={onCancel} />}
      </div>
    </div>
  );
};
