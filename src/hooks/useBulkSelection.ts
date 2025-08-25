import { useState, useCallback, useMemo } from 'react';

interface UseBulkSelectionProps<T> {
  items: T[];
  getItemId: (item: T) => string;
}

interface UseBulkSelectionReturn {
  selectedIds: string[];
  isSelected: (id: string) => boolean;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  toggleSelection: (id: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
  selectedCount: number;
}

export function useBulkSelection<T>({
  items,
  getItemId,
}: UseBulkSelectionProps<T>): UseBulkSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const itemIds = useMemo(
    () => items.map(item => getItemId(item)),
    [items, getItemId]
  );

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds]
  );

  const isAllSelected = useMemo(
    () => itemIds.length > 0 && selectedIds.length === itemIds.length,
    [itemIds.length, selectedIds.length]
  );

  const isPartiallySelected = useMemo(
    () => selectedIds.length > 0 && selectedIds.length < itemIds.length,
    [itemIds.length, selectedIds.length]
  );

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(selectedId => selectedId !== id);
      }
      return [...prev, id];
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(itemIds);
    }
  }, [isAllSelected, itemIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return {
    selectedIds,
    isSelected,
    isAllSelected,
    isPartiallySelected,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    selectedCount: selectedIds.length,
  };
}