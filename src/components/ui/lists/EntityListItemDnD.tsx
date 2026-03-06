import React, { useRef } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { EntityListItem } from "ui/lists/EntityListItem";

type EntityListItemDnDProps<
  T extends { name: string; labelColor?: string; warning?: string },
> = {
  dragType: string;
  acceptTypes?: string[];
  onDrop?: (draggedItem: T, targetItem: T) => void;
} & React.ComponentProps<typeof EntityListItem<T>>;

export const EntityListItemDnD = <
  T extends { name: string; labelColor?: string; warning?: string },
>({
  item,
  dragType,
  acceptTypes,
  onDrop,
  ...rest
}: EntityListItemDnDProps<T>) => {
  const [{ isOver }, drop] = useDrop({
    accept: acceptTypes || [],
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
    drop(draggedItem: T, monitor: DropTargetMonitor) {
      if (monitor.didDrop()) return;
      onDrop?.(draggedItem, item);
    },
  });

  const [_, drag, dragPreview] = useDrag({
    type: dragType,
    item: (): T => item,
    options: { dropEffect: "move" },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const dragRef = useRef<HTMLDivElement>(null);
  drag(dragRef);
  drop(dragRef);
  dragPreview(dragRef);

  return <EntityListItem item={item} {...rest} ref={dragRef} isOver={isOver} />;
};
