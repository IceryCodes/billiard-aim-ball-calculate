export function moveArrayItem<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) return array;
  if (fromIndex < 0 || fromIndex >= array.length) return array;
  if (toIndex < 0 || toIndex >= array.length) return array;

  const newArray = [...array];
  const item = newArray[fromIndex];

  newArray.splice(fromIndex, 1);

  const insertIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;

  newArray.splice(insertIndex, 0, item);

  return newArray;
}

export function removeArrayItem<T>(array: T[], index: number): T[] {
  if (index < 0 || index >= array.length) return array;
  return array.filter((_, i) => i !== index);
}

export function isValidDragType(dataTransfer: DataTransfer): boolean {
  return dataTransfer.types.includes('text/plain');
}

export function getDraggedIndex(dataTransfer: DataTransfer): number | null {
  try {
    const indexStr = dataTransfer.getData('text/plain');
    const index = parseInt(indexStr, 10);
    return isNaN(index) ? null : index;
  } catch {
    return null;
  }
}

export function setDragEffect(dataTransfer: DataTransfer, effect: 'move' | 'copy' | 'link' = 'move'): void {
  dataTransfer.effectAllowed = effect;
  dataTransfer.dropEffect = effect;
}

export function preventDefaultDrag(e: React.DragEvent): void {
  e.preventDefault();
  e.stopPropagation();
}

export function isValidDropTarget(element: Element | null, draggedElement: Element | null): boolean {
  if (!element || !draggedElement) return false;
  return element !== draggedElement && !draggedElement.contains(element);
}

export function generateDragId(text: string, index: number): string {
  return `drag-item-${index}-${text.replace(/\s+/g, '-').toLowerCase()}`;
}

export function formatItemsForCopy(items: string[], includeNumbers = true): string {
  if (includeNumbers) {
    return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
  }
  return items.join('\n');
}

export function reorderArray<T>(array: T[], newOrder: number[]): T[] {
  return newOrder.map((index) => array[index]).filter(Boolean);
}

export function hasSameOrder<T>(array1: T[], array2: T[]): boolean {
  if (array1.length !== array2.length) return false;
  return array1.every((item, index) => item === array2[index]);
}
