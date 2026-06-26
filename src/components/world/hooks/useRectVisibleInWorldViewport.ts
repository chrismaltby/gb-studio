import { useAppSelector } from "store/hooks";

const VIEW_MARGIN = 400;

interface UseRectVisibleInWorldViewportArgs {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const useRectVisibleInWorldViewport = ({
  x,
  y,
  width,
  height,
}: UseRectVisibleInWorldViewportArgs) => {
  return useAppSelector((state) => {
    if (width <= 0 || height <= 0) {
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

    return (
      x + width > viewBoundsX &&
      x < viewBoundsX + viewBoundsWidth &&
      y + height > viewBoundsY &&
      y < viewBoundsY + viewBoundsHeight
    );
  });
};
