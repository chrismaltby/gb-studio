import { sceneSelectors } from "store/features/entities/entitiesSelectors";
import { useAppSelector } from "store/hooks";
import { TILE_SIZE } from "consts";

const VIEW_MARGIN = 400;
const SCENE_LABEL_MARGIN = 50;

export const useSceneVisibleInViewport = (sceneId: string) => {
  return useAppSelector((state) => {
    const scene = sceneSelectors.selectById(state, sceneId);

    if (!scene) {
      return false;
    }

    const zoomRatio = state.editor.zoom / 100;

    if (zoomRatio <= 0) {
      return false;
    }

    const worldScrollX = state.editor.worldScrollX;
    const worldScrollY = state.editor.worldScrollY;
    const worldViewWidth = state.editor.worldViewWidth;
    const worldViewHeight = state.editor.worldViewHeight;
    const sidebarWidth = state.editor.worldSidebarWidth;
    const navigatorWidth = state.project.present.settings.showNavigator
      ? state.editor.navigatorSidebarWidth
      : 0;

    const viewBoundsX = (worldScrollX - VIEW_MARGIN) / zoomRatio;
    const viewBoundsY = (worldScrollY - VIEW_MARGIN) / zoomRatio;

    const viewBoundsWidth =
      (worldViewWidth - sidebarWidth - navigatorWidth + VIEW_MARGIN * 2) /
      zoomRatio;

    const viewBoundsHeight = (worldViewHeight + VIEW_MARGIN * 2) / zoomRatio;

    const sceneWidthPx = scene.width * TILE_SIZE;
    const sceneHeightPx = scene.height * TILE_SIZE;

    return (
      scene.x + sceneWidthPx > viewBoundsX &&
      scene.x < viewBoundsX + viewBoundsWidth &&
      scene.y + sceneHeightPx + SCENE_LABEL_MARGIN > viewBoundsY &&
      scene.y < viewBoundsY + viewBoundsHeight
    );
  });
};
