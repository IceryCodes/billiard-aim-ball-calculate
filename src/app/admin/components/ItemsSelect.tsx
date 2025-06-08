import { DragEvent, ReactNode, useMemo, useState } from 'react';

import { CourtProps } from '@/domains/court';
import { Button } from '@/global-components/buttons/Button';

interface ItemsSelectProps {
  courts: CourtProps[];
  selectedItems: CourtProps[];
  setSelectedItems: (newTargetKeys: CourtProps[]) => void;
}

const ItemsSelect = ({ courts, selectedItems, setSelectedItems }: ItemsSelectProps): ReactNode => {
  const [selectedSourceKeys, setSelectedSourceKeys] = useState<string[]>([]);
  const [selectedTargetKeys, setSelectedTargetKeys] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedFromSource, setDraggedFromSource] = useState<boolean>(false);

  const itemArray = useMemo(
    () => courts.filter((item) => !selectedItems.some((selected) => selected.address === item.address)),
    [courts, selectedItems]
  );

  const selectedArray = useMemo(
    () => courts.filter((item) => selectedItems.some((selected) => selected.address === item.address)),
    [courts, selectedItems]
  );

  const handleTransferToTarget = () => {
    const newTargetKeys = [...selectedItems, ...courts.filter((hospital) => selectedSourceKeys.includes(hospital.address))];
    setSelectedSourceKeys([]);
    setSelectedItems(newTargetKeys);
  };

  const handleTransferToSource = () => {
    const newTargetKeys = selectedItems.filter((selected) => !selectedTargetKeys.includes(selected.address));
    setSelectedTargetKeys([]);
    setSelectedItems(newTargetKeys);
  };

  // Handle drag events
  const handleDragStart = (address: string, fromSource: boolean) => {
    setDraggedItem(address);
    setDraggedFromSource(fromSource);
  };

  const handleDragOver = (event: DragEvent<HTMLUListElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent<HTMLUListElement>, isTarget: boolean) => {
    event.preventDefault();
    if (draggedItem) {
      if (isTarget) {
        // Add dragged item to selected
        const draggedCourt = courts.find((hospital) => hospital.address === draggedItem);
        if (draggedCourt && !selectedItems.includes(draggedCourt)) {
          setSelectedItems([...selectedItems, draggedCourt]);
        }
      } else {
        // Remove dragged item from selected
        const newTargetKeys = selectedItems.filter((selected) => selected.address !== draggedItem);
        setSelectedItems(newTargetKeys);
      }
      setDraggedItem(null);
      setDraggedFromSource(false);
    }
  };

  return (
    <div className="flex gap-4 h-[300px]">
      {/* Source List */}
      <div
        className={`flex-grow border pt-0 rounded w-full overflow-y-scroll ${
          draggedItem && !draggedFromSource ? 'border-2 border-blue-400 shadow-lg' : ''
        }`}
      >
        <div className="shadow-md mb-2 p-2 sticky top-0 z-10 bg-backgroundLight">
          <label className="font-bold">{`搜尋結果 (${itemArray.length})`}</label>
        </div>

        <ul className="space-y-2 p-4" onDragOver={handleDragOver} onDrop={(event) => handleDrop(event, false)}>
          {!itemArray.length && <label>沒有相關資訊</label>}
          {itemArray.map((item) => (
            <li
              key={item.address}
              draggable
              onDragStart={() => handleDragStart(item.address, true)}
              className={`flex flex-col cursor-pointer p-2 rounded border-2 ${
                selectedSourceKeys.includes(item.address) ? 'border-link' : 'border-background'
              }`}
              onClick={() =>
                setSelectedSourceKeys((prev) =>
                  prev.includes(item.address) ? prev.filter((key) => key !== item.address) : [...prev, item.address]
                )
              }
            >
              <span>{item.title}</span>
              <span className="text-sm ml-4">{`${item.county}${item.district}${item.address}`}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Buttons */}
      <div className="flex flex-col justify-center items-center space-y-4 w-1/6">
        <Button text="選擇" onClick={handleTransferToTarget} disabled={selectedSourceKeys.length === 0} className="w-full" />
        <Button text="移除" onClick={handleTransferToSource} disabled={selectedTargetKeys.length === 0} className="w-full" />
      </div>

      {/* Target List */}
      <div
        className={`flex-grow border pt-0 rounded w-full overflow-y-scroll ${
          draggedItem && draggedFromSource ? 'border-2 border-blue-400 shadow-lg' : ''
        }`}
      >
        <div className="shadow-md mb-2 p-2 sticky top-0 z-10 bg-backgroundLight">
          <label className="font-bold">{`選擇項目 (${selectedArray.length})`}</label>
        </div>

        <ul className="space-y-2 p-4" onDragOver={handleDragOver} onDrop={(event) => handleDrop(event, true)}>
          {!selectedArray.length && <label>請從左側進行挑選</label>}
          {selectedArray.map((item) => (
            <li
              key={item.address}
              draggable
              onDragStart={() => handleDragStart(item.address, false)}
              className={`flex flex-col cursor-pointer p-2 rounded border-2 ${
                selectedTargetKeys.includes(item.address) ? 'border-link' : 'border-background'
              }`}
              onClick={() =>
                setSelectedTargetKeys((prev) =>
                  prev.includes(item.address) ? prev.filter((key) => key !== item.address) : [...prev, item.address]
                )
              }
            >
              <span>{item.title}</span>
              <span className="text-sm ml-4">{`${item.county}${item.district}${item.address}`}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ItemsSelect;
