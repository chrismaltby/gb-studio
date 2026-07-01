import { PayloadAction, UnknownAction } from "@reduxjs/toolkit";

export type ResizeTilemapLayersPayload = {
  sceneId: string;
  resizeAxis: "width" | "height";
  width: number;
  height: number;
  shiftX?: number;
  shiftY?: number;
};

export const isResizeTilemapLayersAction = (
  action: UnknownAction,
): action is PayloadAction<ResizeTilemapLayersPayload> =>
  action.type === "entities/resizeTilemapLayers";
