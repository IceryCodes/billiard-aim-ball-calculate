import { useCallback, useState } from 'react';

import { Button } from '../buttons/Button';

interface TournamentSlotEditorProps {
  initialTags: string[];
  onConfirm: (finalOrder: string[]) => void;
  onCancel?: () => void;
}

interface DragData {
  type: 'name' | 'slot';
  index: number;
  name: string;
}

export const TournamentSlotEditor = ({ initialTags, onConfirm, onCancel }: TournamentSlotEditorProps) => {
  // 左邊未分配的姓名
  const [availableNames, setAvailableNames] = useState<string[]>(initialTags);
  // 右邊32個位置的分配情況 (空字串表示空籤)
  const [slots, setSlots] = useState<string[]>(new Array(32).fill(''));
  const [draggedData, setDraggedData] = useState<DragData | null>(null);

  // 拖拉開始
  const handleDragStart = useCallback((e: React.DragEvent, data: DragData) => {
    setDraggedData(data);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(data));
  }, []);

  // 拖拉結束
  const handleDragEnd = useCallback(() => {
    setDraggedData(null);
  }, []);

  // 拖拉經過
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // 放到位置槽
  const handleDropToSlot = useCallback(
    (e: React.DragEvent, targetSlotIndex: number) => {
      e.preventDefault();
      if (!draggedData) return;

      if (draggedData.type === 'name') {
        // 從左邊名單拖到右邊位置
        const nameToMove = draggedData.name;

        // 如果目標位置已有人，把原來的人放回左邊
        const existingName = slots[targetSlotIndex];
        if (existingName) {
          setAvailableNames((prev) => [...prev, existingName]);
        }

        // 把新名字放到位置，從左邊移除
        setSlots((prev) => {
          const newSlots = [...prev];
          newSlots[targetSlotIndex] = nameToMove;
          return newSlots;
        });

        setAvailableNames((prev) => prev.filter((_, index) => index !== draggedData.index));
      } else if (draggedData.type === 'slot') {
        // 從位置拖到另一個位置（交換）
        const sourceIndex = draggedData.index;
        if (sourceIndex === targetSlotIndex) return;

        setSlots((prev) => {
          const newSlots = [...prev];
          const temp = newSlots[sourceIndex];
          newSlots[sourceIndex] = newSlots[targetSlotIndex];
          newSlots[targetSlotIndex] = temp;
          return newSlots;
        });
      }
    },
    [draggedData, slots]
  );

  // 放回左邊名單區
  const handleDropToNameList = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!draggedData || draggedData.type !== 'slot') return;

      const slotIndex = draggedData.index;
      const nameToReturn = slots[slotIndex];
      if (!nameToReturn) return;

      // 把名字放回左邊，清空位置
      setAvailableNames((prev) => [...prev, nameToReturn]);
      setSlots((prev) => {
        const newSlots = [...prev];
        newSlots[slotIndex] = '';
        return newSlots;
      });
    },
    [draggedData, slots]
  );

  // 重置
  const handleReset = useCallback(() => {
    setAvailableNames(initialTags);
    setSlots(new Array(32).fill(''));
  }, [initialTags]);

  // 確認
  const handleConfirm = useCallback(() => {
    onConfirm(slots);
  }, [slots, onConfirm]);

  // 計算比賽組別文字
  const getMatchLabel = (index: number): string => {
    const matchNumber = Math.floor(index / 2) + 1;
    return `比賽${matchNumber}`;
  };

  // 雙擊移除位置上的名字
  const handleSlotDoubleClick = useCallback(
    (slotIndex: number) => {
      const nameToReturn = slots[slotIndex];
      if (!nameToReturn) return;

      setAvailableNames((prev) => [...prev, nameToReturn]);
      setSlots((prev) => {
        const newSlots = [...prev];
        newSlots[slotIndex] = '';
        return newSlots;
      });
    },
    [slots]
  );

  const assignedCount = slots.filter((slot) => slot !== '').length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-sm">
        <span>拖拉姓名到右邊位置 (已分配: {assignedCount}/32)</span>
        <Button onClick={handleReset} text="重置分配" />
      </div>

      <div className="flex gap-4">
        {/* 左邊：待分配姓名列表 */}
        <div className="p-3 rounded border">
          <div className="text-sm font-medium mb-3 text-center">待分配選手 ({availableNames.length})</div>
          <div className="grid grid-cols-2 gap-4 w-[400px]" onDragOver={handleDragOver} onDrop={handleDropToNameList}>
            {availableNames.length === 0 ? (
              <div className="text-center py-8 text-gray-400">所有選手已分配</div>
            ) : (
              availableNames.map((name, index) => (
                <div
                  key={`${name}-${index}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, { type: 'name', index, name })}
                  onDragEnd={handleDragEnd}
                  className={`
                    h-10 p-2 bg-foreground border rounded cursor-move text-sm
                    hover:bg-blue-50 hover:border-blue-300 transition-colors w-[100px]
                  `}
                >
                  <div className="flex items-center gap-2">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="text-gray-400">
                      <circle cx="2" cy="2" r="1" />
                      <circle cx="6" cy="2" r="1" />
                      <circle cx="2" cy="6" r="1" />
                      <circle cx="6" cy="6" r="1" />
                    </svg>
                    <span className="text-background">{name}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右邊：32個比賽位置 */}
        <div className="flex-1 p-3 rounded border">
          <div className="text-sm font-medium mb-3 text-center">比賽位置表 (32強單敗)</div>
          <div className="grid grid-cols-2 gap-3 overflow-y-auto w-[350px]">
            {Array.from({ length: 16 }, (_, matchIndex) => (
              <div key={matchIndex} className="space-y-1">
                <div className="text-xs text-center font-medium mb-2">{getMatchLabel(matchIndex * 2)}</div>
                {[0, 1].map((playerIndex) => {
                  const slotIndex = matchIndex * 2 + playerIndex;
                  const playerName = slots[slotIndex];
                  const isEmpty = !playerName;

                  return (
                    <div
                      key={slotIndex}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropToSlot(e, slotIndex)}
                      onDoubleClick={() => handleSlotDoubleClick(slotIndex)}
                      draggable={!isEmpty}
                      onDragStart={
                        !isEmpty
                          ? (e) =>
                              handleDragStart(e, {
                                type: 'slot',
                                index: slotIndex,
                                name: playerName,
                              })
                          : undefined
                      }
                      onDragEnd={handleDragEnd}
                      className={`
                        h-10 px-3 border-2 border-dashed rounded flex items-center justify-center
                        text-sm transition-all cursor-pointer
                        ${
                          isEmpty
                            ? 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                            : 'border-blue-400 bg-blue-100 cursor-move hover:bg-blue-200'
                        }
                      `}
                      title={isEmpty ? '拖拉選手到此位置' : '雙擊移除選手'}
                    >
                      {isEmpty ? (
                        <span className="text-gray-400">空籤</span>
                      ) : (
                        <div className="flex items-center gap-1 w-full">
                          <svg
                            width="6"
                            height="6"
                            viewBox="0 0 6 6"
                            fill="currentColor"
                            className="text-blue-600 flex-shrink-0"
                          >
                            <circle cx="1.5" cy="1.5" r="0.5" />
                            <circle cx="4.5" cy="1.5" r="0.5" />
                            <circle cx="1.5" cy="4.5" r="0.5" />
                            <circle cx="4.5" cy="4.5" r="0.5" />
                          </svg>
                          <span className="truncate text-blue-800 font-medium">{playerName}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-4">
        <Button text={`確定分配 (${assignedCount}/32)`} onClick={handleConfirm} />
        {onCancel && <Button text="取消" onClick={onCancel} />}
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <div>💡 使用說明：</div>
        <div>• 從左邊拖拉選手姓名到右邊比賽位置</div>
        <div>• 雙擊右邊已分配的選手可移除回左邊</div>
        <div>• 右邊位置間也可以互相拖拉交換</div>
        <div>• 空籤位置會自動儲存為空白</div>
      </div>
    </div>
  );
};
