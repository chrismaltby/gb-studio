import { useCallback, useMemo } from "react";
import { getParentPath } from "shared/lib/helpers/virtualFilesystem";
import { createFlatListOuterDropTarget } from "ui/lists/FlatListOuterDropTarget";

export type ReparentArgs = {
  draggedPath: string;
  dropFolder: string;
};

export const useFlatListReparentDnD = <TItem>({
  acceptTypes,
  onReparent,
  isReparentable,
  canDrop,
  getName,
  getDropFolder,
}: {
  acceptTypes: string[];
  onReparent: (item: TItem, args: ReparentArgs) => void;
  isReparentable?: (item: TItem) => boolean;
  canDrop?: (dragged: TItem, target: TItem) => boolean;
  getName: (item: TItem) => string;
  getDropFolder: (target: TItem) => string;
}) => {
  const handleReparent = useCallback(
    (draggedItem: TItem, dropFolder: string) => {
      if (isReparentable && !isReparentable(draggedItem)) {
        return;
      }
      const name = getName(draggedItem);

      if (getParentPath(name) === dropFolder) {
        return;
      }

      onReparent(draggedItem, {
        draggedPath: name,
        dropFolder,
      });
    },
    [isReparentable, getName, onReparent],
  );

  const onDropOntoItem = useCallback(
    (draggedItem: TItem, targetItem: TItem) => {
      if (canDrop && !canDrop(draggedItem, targetItem)) {
        return;
      }
      const dropFolder = getDropFolder(targetItem);
      handleReparent(draggedItem, dropFolder);
    },
    [handleReparent, getDropFolder, canDrop],
  );

  const onDropOntoRoot = useCallback(
    (draggedItem: TItem) => {
      handleReparent(draggedItem, "");
    },
    [handleReparent],
  );

  const flatListDropzone = useMemo(
    () => createFlatListOuterDropTarget<TItem>(acceptTypes, onDropOntoRoot),
    [acceptTypes, onDropOntoRoot],
  );

  return {
    onDropOntoItem,
    flatListDropzone,
  };
};
