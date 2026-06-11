import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SortableItem {
  uuid: string;
  display_order: number;
}

interface SortableRowProps {
  id: string;
  children: React.ReactNode;
  /** Show/hide the drag handle */
  showHandle?: boolean;
}

interface SortableListProps<T extends SortableItem> {
  items: T[];
  /** Called with the full updated list after a drag or position-input change */
  onReorder: (reordered: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Show the position input beside each item (default true) */
  showPositionInput?: boolean;
  className?: string;
}

// ─── SortableRow ─────────────────────────────────────────────────────────────

export function SortableRow({ id, children, showHandle = true }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center group">
      {showHandle && (
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 p-1 mr-2 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
          title="Drag to reorder"
          type="button"
        >
          <GripVertical className="h-5 w-5" />
        </button>
      )}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ─── PositionInput ────────────────────────────────────────────────────────────

interface PositionInputProps {
  currentPosition: number;  // 1-based
  total: number;
  onMove: (newPosition: number) => void;
}

export function PositionInput({ currentPosition, total, onMove }: PositionInputProps) {
  const [value, setValue] = useState(String(currentPosition));

  const commit = () => {
    const n = parseInt(value, 10);
    if (!isNaN(n) && n >= 1 && n <= total && n !== currentPosition) {
      onMove(n);
    } else {
      setValue(String(currentPosition)); // reset on invalid
    }
  };

  return (
    <input
      type="number"
      min={1}
      max={total}
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); }}
      className="w-14 text-center text-xs border border-gray-300 rounded px-1 py-0.5 focus:outline-none focus:border-blue-400"
      title={`Position (1–${total}). Type a number and press Enter or click away.`}
    />
  );
}

// ─── SortableList ─────────────────────────────────────────────────────────────

export function SortableList<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
  showPositionInput = true,
  className = '',
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(i => i.uuid === active.id);
    const newIndex = items.findIndex(i => i.uuid === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
      ...item,
      display_order: idx + 1,
    }));
    onReorder(reordered as T[]);
  };

  const handlePositionMove = (fromIndex: number, toPosition: number) => {
    const toIndex = toPosition - 1; // convert to 0-based
    const reordered = arrayMove(items, fromIndex, toIndex).map((item, idx) => ({
      ...item,
      display_order: idx + 1,
    }));
    onReorder(reordered as T[]);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map(i => i.uuid)}
        strategy={verticalListSortingStrategy}
      >
        <div className={className}>
          {items.map((item, index) => (
            <SortableRow key={item.uuid} id={item.uuid}>
              <div className="flex items-center gap-2">
                {showPositionInput && (
                  <PositionInput
                    currentPosition={index + 1}
                    total={items.length}
                    onMove={newPos => handlePositionMove(index, newPos)}
                  />
                )}
                <div className="flex-1 min-w-0">
                  {renderItem(item, index)}
                </div>
              </div>
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
