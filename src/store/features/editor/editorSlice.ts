import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BRUSH_8PX, COLLISION_ALL } from "../../../consts";

export type Tool =
  | "triggers"
  | "actors"
  | "collisions"
  | "colors"
  | "scene"
  | "eraser"
  | "select";

export type Brush = "8px" | "16px" | "fill";

export type EditorSelection =
  | "world"
  | "scene"
  | "actor"
  | "trigger"
  | "customEvent";

interface EditorState {
  tool: Tool;
  type: EditorSelection;
  worldFocus: boolean;
  scene: string;
  index: number;
  zoom: number;
  zoomSprite: number;
  zoomImage: number;
  zoomUI: number;
  dragging: string;
  sceneDragging: boolean;
  sceneDragX: number;
  sceneDragY: number;
  uiVersion: number;
  variableVersion: number;
  searchTerm: string;
  hover: {
    sceneId: string;
    actorId: string;
    x: number;
    y: number;
  };
  worldScrollX: number;
  worldScrollY: number;
  worldScrollThrottledX: number;
  worldScrollThrottledY: number;
  worldViewWidth: number;
  worldViewHeight: number;
  selectedPalette: number;
  selectedTileType: number;
  selectedBrush: Brush;
  showLayers: boolean;
  lastScriptTab: string;
  lastScriptTabScene: string;
  lastScriptTabSecondary: string;
  profile: boolean;
}

const initialState: EditorState = {
  tool: "select",
  type: "world",
  worldFocus: false,
  scene: "",
  index: 0,
  zoom: 100,
  zoomSprite: 400,
  zoomImage: 200,
  zoomUI: 200,
  dragging: "",
  sceneDragging: false,
  sceneDragX: 0,
  sceneDragY: 0,
  uiVersion: 0,
  variableVersion: 0,
  searchTerm: "",
  hover: {
    sceneId: "",
    actorId: "",
    x: 0,
    y: 0,
  },
  worldScrollX: 0,
  worldScrollY: 0,
  worldScrollThrottledX: 0,
  worldScrollThrottledY: 0,
  worldViewWidth: 0,
  worldViewHeight: 0,
  selectedPalette: 0,
  selectedTileType: COLLISION_ALL,
  selectedBrush: BRUSH_8PX,
  showLayers: true,
  lastScriptTab: "",
  lastScriptTabScene: "",
  lastScriptTabSecondary: "",
  profile: false,
};

const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    setTool: (state, action: PayloadAction<{ tool: Tool }>) => {
      state.tool = action.payload.tool;
    },

    setBrush: (state, action: PayloadAction<{ brush: Brush }>) => {
      state.selectedBrush = action.payload.brush;
    },

    setShowLayers: (state, action: PayloadAction<{ showLayers: boolean }>) => {
      state.showLayers = action.payload.showLayers;
    },

    resizeWorldView: (
      state,
      action: PayloadAction<{ width: number; height: number }>
    ) => {
      state.worldViewWidth = action.payload.width;
      state.worldViewHeight = action.payload.height;
    },
  },
});

export const { actions, reducer } = editorSlice;

export default reducer;
