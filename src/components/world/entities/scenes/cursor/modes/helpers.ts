import { BRUSH_16PX, TILE_SIZE } from "consts";
import type { Brush } from "store/features/editor/editorState";

export const paintCursorSize = (brush: Brush) =>
  brush === BRUSH_16PX ? TILE_SIZE * 2 : TILE_SIZE;
