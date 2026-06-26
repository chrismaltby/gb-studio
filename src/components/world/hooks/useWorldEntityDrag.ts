import { useCallback, useEffect, useRef } from "react";
import { MIDDLE_MOUSE, TILE_SIZE } from "consts";
import entitiesActions from "store/features/entities/entitiesActions";
import { useAppDispatch, useAppSelector } from "store/hooks";

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
  entityX: number;
  entityY: number;
  zoomRatio: number;
}

export const useWorldEntityDrag = ({
  entityId,
  editable,
  x,
  y,
  onSelect,
}: UseWorldEntityDragArgs) => {
  const dispatch = useAppDispatch();

  const zoomRatio = useAppSelector((state) => state.editor.zoom / 100);

  const sceneSelectionIds = useAppSelector(
    (state) => state.editor.sceneSelectionIds,
  );

  const latest = useRef({
    editable,
    x,
    y,
    zoomRatio,
    onSelect,
  });

  latest.current = {
    editable,
    x,
    y,
    zoomRatio,
    onSelect,
  };

  const currentSceneSelectionIds = useRef<string[]>([]);
  useEffect(() => {
    currentSceneSelectionIds.current = sceneSelectionIds;
  }, [sceneSelectionIds]);

  const dragState = useRef<WorldEntityDragState>({
    lastPageX: -1,
    lastPageY: -1,
    entityX: 0,
    entityY: 0,
    zoomRatio: 1,
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

      dispatch(
        entitiesActions.moveWorldEntities({
          entityId,
          x: Math.round(dragState.current.entityX / TILE_SIZE) * TILE_SIZE,
          y: Math.round(dragState.current.entityY / TILE_SIZE) * TILE_SIZE,
          additionalEntityIds: currentSceneSelectionIds.current,
        }),
      );
    },
    [dispatch, entityId],
  );

  const onEndDrag = useCallback(() => {
    window.removeEventListener("mousemove", onMoveDrag);
    window.removeEventListener("mouseup", onEndDrag);
  }, [onMoveDrag]);

  const onStartDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const { editable, x, y, zoomRatio, onSelect } = latest.current;

      if (!editable || e.nativeEvent.which === MIDDLE_MOUSE) {
        return;
      }

      dragState.current.lastPageX = e.pageX;
      dragState.current.lastPageY = e.pageY;
      dragState.current.entityX = x;
      dragState.current.entityY = y;
      dragState.current.zoomRatio = zoomRatio;

      onSelect();

      window.addEventListener("mousemove", onMoveDrag);
      window.addEventListener("mouseup", onEndDrag);
    },
    [onEndDrag, onMoveDrag],
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
