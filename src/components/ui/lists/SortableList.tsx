import React, { useCallback, useEffect, useRef, useState } from "react";
import { SortableItem } from "ui/lists/SortableItem";
import { StyledSortableList } from "./style";
import { throttle } from "lodash";

export type SortableListOrientation = "horizontal" | "vertical";

interface SortableListProps<T> {
  orientation?: SortableListOrientation;
  gap?: number;
  padding?: number;
  itemType: string;
  items: T[];
  selectedIndex: number;
  renderItem: (
    item: T,
    {
      isSelected,
      isOver,
    }: {
      isSelected: boolean;
      isDragging: boolean;
      isDraggingAny: boolean;
      isOver: boolean;
    },
  ) => JSX.Element;
  extractKey: (item: T) => string;
  onSelect: (item: T, e?: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  moveItems: (dragIndex: number, hoverIndex: number) => void;
  onKeyDown?: (e: KeyboardEvent) => boolean | void;
  appendComponent?: JSX.Element;
}

export const SortableList = <T,>({
  itemType,
  items,
  orientation = "horizontal",
  gap = 10,
  padding = 10,
  selectedIndex,
  renderItem,
  extractKey,
  onSelect,
  moveItems,
  onKeyDown,
  appendComponent,
}: SortableListProps<T>) => {
  const [hasFocus, setHasFocus] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleKeys = useCallback(
    (e: KeyboardEvent) => {
      if (!hasFocus) {
        return;
      }
      if (onKeyDown?.(e)) {
        // If onkeydown returns true don't handle input internally
        return;
      }
      if (
        (orientation === "horizontal" && e.key === "ArrowRight") ||
        (orientation === "vertical" && e.key === "ArrowDown")
      ) {
        e.preventDefault();
        throttledNext.current(items, selectedIndex || -1);
      } else if (
        (orientation === "horizontal" && e.key === "ArrowLeft") ||
        (orientation === "vertical" && e.key === "ArrowUp")
      ) {
        e.preventDefault();
        throttledPrev.current(items, selectedIndex || -1);
      } else if (e.key === "Home") {
        if (items[0]) {
          onSelect(items[0]);
        }
      } else if (e.key === "End") {
        if (items[items.length - 1]) {
          onSelect(items[items.length - 1]);
        }
      }
    },
    [hasFocus, onKeyDown, orientation, items, selectedIndex, onSelect],
  );

  const throttledNext = useRef(
    throttle((frames: T[], selectedIndex: number) => {
      const nextIndex = (selectedIndex + 1) % frames.length;
      const nextItem = frames[nextIndex];
      if (nextItem) {
        onSelect(nextItem);
      }
    }, 150),
  );

  const throttledPrev = useRef(
    throttle((frames: T[], selectedIndex: number) => {
      const prevIndex = (frames.length + selectedIndex - 1) % frames.length;
      const prevItem = frames[prevIndex];
      if (prevItem) {
        onSelect(prevItem);
      }
    }, 150),
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeys);
    return () => {
      window.removeEventListener("keydown", handleKeys);
    };
  });

  return (
    <StyledSortableList
      tabIndex={0}
      onFocus={() => setHasFocus(true)}
      onBlur={() => setHasFocus(false)}
      $orientation={orientation}
      $gap={gap}
      $padding={padding}
    >
      {items.map((item, index) => (
        <SortableItem
          key={extractKey(item)}
          itemType={itemType}
          item={item}
          index={index}
          renderItem={(item, { isOver, isDragging }) => {
            return renderItem(item, {
              isSelected: selectedIndex === index,
              isOver,
              isDragging,
              isDraggingAny: dragging,
            });
          }}
          onSelect={(e) => {
            onSelect(item, e);
          }}
          orientation={orientation}
          moveItems={moveItems}
          setDragging={setDragging}
        />
      ))}
      {appendComponent}
    </StyledSortableList>
  );
};
