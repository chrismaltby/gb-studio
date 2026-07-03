import { useMemo } from "react";
import clamp from "shared/lib/helpers/clamp";
import { sceneSelectors } from "store/features/entities/entitiesSelectors";
import { useAppSelector } from "store/hooks";

const TILE_SIZE = 8;
const MIN_LABEL_WIDTH = 160;

const calculateLabelOffsets = (
  sceneX: number,
  sceneWidthPx: number,
  viewBoundsX: number,
  viewBoundsWidth: number,
) => {
  const maxOffset = Math.max(0, sceneWidthPx - MIN_LABEL_WIDTH);
  const left = viewBoundsX - sceneX;
  const right = sceneX + sceneWidthPx - (viewBoundsX + viewBoundsWidth);
  return {
    left: clamp(left, 0, maxOffset),
    right: clamp(right, 0, maxOffset),
  };
};

export const useSceneLabelOffsets = (sceneId: string) => {
  const sceneX = useAppSelector(
    (state) => sceneSelectors.selectById(state, sceneId)?.x ?? 0,
  );

  const sceneWidth = useAppSelector((state) => {
    const scene = sceneSelectors.selectById(state, sceneId);
    if (!scene) {
      return 0;
    }
    return scene.type === "LOGO" ? 20 : scene.width;
  });

  const worldScrollX = useAppSelector((state) => state.editor.worldScrollX);

  const worldViewWidth = useAppSelector((state) => state.editor.worldViewWidth);

  const sidebarWidth = useAppSelector(
    (state) => state.editor.worldSidebarWidth,
  );

  const navigatorWidth = useAppSelector((state) =>
    state.project.present.settings.showNavigator
      ? state.editor.navigatorSidebarWidth
      : 0,
  );

  const zoomRatio = useAppSelector((state) => state.editor.zoom / 100);

  return useMemo(() => {
    if (sceneWidth <= 0 || zoomRatio <= 0) {
      return {
        left: 0,
        right: 0,
      };
    }

    const sceneWidthPx = sceneWidth * TILE_SIZE;
    const viewBoundsX = worldScrollX / zoomRatio;
    const viewBoundsWidth =
      (worldViewWidth - sidebarWidth - navigatorWidth) / zoomRatio;

    const shouldOffsetLabels = sceneWidthPx > viewBoundsWidth / 2;

    if (!shouldOffsetLabels) {
      return {
        left: 0,
        right: 0,
      };
    }

    return calculateLabelOffsets(
      sceneX,
      sceneWidthPx,
      viewBoundsX,
      viewBoundsWidth,
    );
  }, [
    sceneX,
    sceneWidth,
    worldScrollX,
    worldViewWidth,
    sidebarWidth,
    navigatorWidth,
    zoomRatio,
  ]);
};
