import { useCallback, useEffect, useRef } from "react";
import { MIDDLE_MOUSE, TILE_SIZE } from "consts";
import entitiesActions from "store/features/entities/entitiesActions";
import { useAppDispatch, useAppStore } from "store/hooks";

interface UseWorldEntityDragArgs {
  entityId: string;
  editable?: boolean;
  x: number;
  y: number;
  onSelect: () => void;
}

interface WorldEntityDragState {
  lastPageX: number;
  lastPageY: number;
  lastSnappedX: number;
  lastSnappedY: number;
  entityX: number;
  entityY: number;
  zoomRatio: number;
  additionalEntityIds: string[];
}

const snapToGrid = (value: number) => Math.round(value / TILE_SIZE) * TILE_SIZE;

export const useWorldEntityDrag = ({
  entityId,
  editable,
  x,
  y,
  onSelect,
}: UseWorldEntityDragArgs) => {
  const dispatch = useAppDispatch();
  const store = useAppStore();

  const latest = useRef({
    editable,
    x,
    y,
    onSelect,
  });

  latest.current = {
    editable,
    x,
    y,
    onSelect,
  };

  const dragState = useRef<WorldEntityDragState>({
    lastPageX: -1,
    lastPageY: -1,
    lastSnappedX: -1,
    lastSnappedY: -1,
    entityX: 0,
    entityY: 0,
    zoomRatio: 1,
    additionalEntityIds: [],
  });

  const onMoveDrag = useCallback(
    (e: MouseEvent) => {
      const dragDeltaX =
        (e.pageX - dragState.current.lastPageX) / dragState.current.zoomRatio;

      const dragDeltaY =
        (e.pageY - dragState.current.lastPageY) / dragState.current.zoomRatio;

      dragState.current.lastPageX = e.pageX;
      dragState.current.lastPageY = e.pageY;
      dragState.current.entityX += dragDeltaX;
      dragState.current.entityY += dragDeltaY;

      const snappedX = snapToGrid(dragState.current.entityX);
      const snappedY = snapToGrid(dragState.current.entityY);

      if (
        snappedX !== dragState.current.lastSnappedX ||
        snappedY !== dragState.current.lastSnappedY
      ) {
        dispatch(
          entitiesActions.moveWorldEntities({
            entityId,
            x: snappedX,
            y: snappedY,
            additionalEntityIds: dragState.current.additionalEntityIds,
          }),
        );

        dragState.current.lastSnappedX = snappedX;
        dragState.current.lastSnappedY = snappedY;
      }
    },
    [dispatch, entityId],
  );

  const onEndDrag = useCallback(() => {
    window.removeEventListener("mousemove", onMoveDrag);
    window.removeEventListener("mouseup", onEndDrag);
  }, [onMoveDrag]);

  const onStartDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const { editable, x, y, onSelect } = latest.current;

      if (!editable || e.nativeEvent.which === MIDDLE_MOUSE) {
        return;
      }

      const state = store.getState();
      const zoomRatio = state.editor.zoom / 100;

      if (zoomRatio <= 0) {
        return;
      }

      onSelect();

      const selectedEntityIds = store.getState().editor.sceneSelectionIds;
      const snappedX = snapToGrid(x);
      const snappedY = snapToGrid(y);

      dragState.current.lastPageX = e.pageX;
      dragState.current.lastPageY = e.pageY;
      dragState.current.entityX = x;
      dragState.current.entityY = y;
      dragState.current.zoomRatio = zoomRatio;
      dragState.current.additionalEntityIds = selectedEntityIds;
      dragState.current.lastSnappedX = snappedX;
      dragState.current.lastSnappedY = snappedY;

      window.addEventListener("mousemove", onMoveDrag);
      window.addEventListener("mouseup", onEndDrag);
    },
    [onEndDrag, onMoveDrag, store],
  );

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onMoveDrag);
      window.removeEventListener("mouseup", onEndDrag);
    };
  }, [onEndDrag, onMoveDrag]);

  return {
    onStartDrag,
  };
};
