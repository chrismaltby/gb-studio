import { zoomSections, ZoomSection } from "./editorState";

export const isZoomSection = (value: unknown): value is ZoomSection => {
  return zoomSections.includes(value as ZoomSection);
};
