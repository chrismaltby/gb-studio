import React from "react";
import { DropTargetMonitor, useDrag, useDrop } from "react-dnd";
import type { SortableListOrientation } from "./SortableList";

interface SortableItemProps<T> {
  itemType: string;
  item: T;
  index: number;
  orientation: SortableListOrientation;
  renderItem: (
    item: T,
    { isOver, isDragging }: { isOver: boolean; isDragging: boolean },
  ) => JSX.Element;
  onSelect: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  moveItems: (dragIndex: number, hoverIndex: number) => void;
  setDragging: (isDragging: boolean) => void;
}

export const SortableItem = <T,>({
  itemType,
  item,
  index,
  orientation,
  renderItem,
  onSelect,
  moveItems,
  setDragging,
}: SortableItemProps<T>) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop({
    accept: itemType,
    hover(_, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return null;
      }
      const dragIndex = (monitor.getItem() as { index: number }).index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();

      if (orientation === "horizontal") {
        // Get horizontal middle
        const hoverMiddleX =
          (hoverBoundingRect.right - hoverBoundingRect.left) / 2;

        // Determine mouse position
        const clientOffset = monitor.getClientOffset();

        if (!clientOffset) {
          return;
        }

        // Get pixels to the left
        const hoverClientX = clientOffset.x - hoverBoundingRect.left;

        // Only perform the move when the mouse has crossed half of the items height
        // When dragging downwards, only move when the cursor is below 50%
        // When dragging upwards, only move when the cursor is above 50%

        // Dragging from left to right but not passed middle of element
        if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
          return;
        }

        // Dragging from right to left but not passed middle of element
        if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
          return;
        }
      } else {
        // Get vertical middle
        const hoverMiddleY =
          (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

        // Determine mouse position
        const clientOffset = monitor.getClientOffset();

        if (!clientOffset) {
          return;
        }

        // Get pixels to the top
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;

        // Only perform the move when the mouse has crossed half of the items height
        // When dragging downwards, only move when the cursor is below 50%
        // When dragging upwards, only move when the cursor is above 50%

        // Dragging from top to bottom but not passed middle of element
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
          return;
        }

        // Dragging from bottom to top but not passed middle of element
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
          return;
        }
      }

      // Time to actually perform the action
      moveItems(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      (monitor.getItem() as { index: number }).index = hoverIndex;
    },
    collect(monitor) {
      return {
        isOver: monitor.isOver({ shallow: true }),
      };
    },
  });

  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: itemType,
    collect: (monitor) => {
      return {
        isDragging: monitor.isDragging(),
      };
    },
    item: () => {
      setDragging(true);
      return {
        index,
        data: item,
      };
    },
    end: () => setDragging(false),
  }));

  drag(drop(ref));

  return (
    <div ref={dragPreview}>
      <div ref={ref} onMouseDown={onSelect}>
        {renderItem(item, { isDragging, isOver })}
      </div>
    </div>
  );
};
