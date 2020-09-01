import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BRUSH_8PX, COLLISION_ALL } from "../../../consts";
import { zoomIn, zoomOut } from "../../../lib/helpers/zoom";
import {
  DRAG_ACTOR,
  DRAG_TRIGGER,
  DRAG_DESTINATION,
  DRAG_PLAYER,
} from "../../../reducers/editorReducer";
import { actions as entityActions } from "../entities/entitiesSlice";

export type Tool =
  | "triggers"
  | "actors"
  | "collisions"
  | "colors"
  | "scene"
  | "eraser"
  | "select";

export type Brush = "8px" | "16px" | "fill";

export type EditorSelectionType =
  | "world"
  | "scene"
  | "actor"
  | "trigger"
  | "customEvent";

export type ZoomSection = "world" | "sprites" | "backgrounds" | "ui";

export interface EditorState {
  tool: Tool;
  type: EditorSelectionType;
  worldFocus: boolean;
  scene: string;
  entityId: string;
  eventId: string;
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
  worldViewWidth: number;
  worldViewHeight: number;
  selectedPalette: number;
  selectedTileType: number;
  selectedBrush: Brush;
  showLayers: boolean;
  lastScriptTab: string;
  lastScriptTabScene: string;
  lastScriptTabSecondary: string;
  worldSidebarWidth: number;
  filesSidebarWidth: number;
  profile: boolean;
}

export const initialState: EditorState = {
  tool: "select",
  type: "world",
  worldFocus: false,
  scene: "",
  entityId: "",
  eventId: "",
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
  worldSidebarWidth: 300,
  filesSidebarWidth: 300,
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

    setSelectedPalette: (
      state,
      action: PayloadAction<{ paletteIndex: number }>
    ) => {
      state.selectedPalette = action.payload.paletteIndex;
    },

    setSelectedTileType: (
      state,
      action: PayloadAction<{ tileType: number }>
    ) => {
      state.selectedTileType = action.payload.tileType;
    },

    setShowLayers: (state, action: PayloadAction<{ showLayers: boolean }>) => {
      state.showLayers = action.payload.showLayers;
    },

    scrollWorld: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.worldScrollX = action.payload.x;
      state.worldScrollY = action.payload.y;
    },

    resizeWorldView: (
      state,
      action: PayloadAction<{ width: number; height: number }>
    ) => {
      state.worldViewWidth = action.payload.width;
      state.worldViewHeight = action.payload.height;
    },

    selectWorld: (state, _action) => {
      state.scene = "";
      state.type = "world";
      state.worldFocus = true;
    },

    sceneHover: (
      state,
      action: PayloadAction<{ sceneId: string; x: number; y: number }>
    ) => {
      state.hover = {
        ...state.hover,
        sceneId: action.payload.sceneId,
        x: action.payload.x,
        y: action.payload.y,
      };
      state.eventId = state.dragging === "" ? "" : state.eventId;
    },

    selectScene: (state, action: PayloadAction<{ sceneId: string }>) => {
      state.type = "scene";
      state.scene = action.payload.sceneId;
      state.worldFocus = true;
    },

    selectCustomEvent: (state, action: PayloadAction<{ customEventId: string }>) => {
      state.type = "customEvent";
      state.scene = "";
      state.entityId = action.payload.customEventId
    },

    selectActor: (state, action: PayloadAction<{ actorId: string; sceneId: string }>) => {
      state.type = "actor";
      state.scene = action.payload.sceneId;
      state.entityId = action.payload.actorId;
      state.worldFocus = true;
      state.tool = "select";
    },

    selectTrigger: (
      state,
      action: PayloadAction<{ triggerId: string; sceneId: string }>
    ) => {
      state.type = "trigger";
      state.scene = action.payload.sceneId;
      state.entityId = action.payload.triggerId;
      state.worldFocus = true;
      state.tool = "select";
    },

    dragTriggerStart: (
      state,
      action: PayloadAction<{ triggerId: string; sceneId: string }>
    ) => {
      state.type = "trigger";
      state.dragging = DRAG_TRIGGER;
      state.entityId = action.payload.triggerId;
      state.scene = action.payload.sceneId;
    },

    dragTriggerStop: (state, _action) => {
      state.dragging = "";
    },

    dragActorStart: (
      state,
      action: PayloadAction<{ actorId: string; sceneId: string }>
    ) => {
      state.type = "actor";
      state.dragging = DRAG_ACTOR;
      state.entityId = action.payload.actorId;
      state.scene = action.payload.sceneId;
      state.worldFocus = true;
    },

    dragActorStop: (state, _action) => {
      state.dragging = "";
    },

    dragDestinationStart: (
      state,
      action: PayloadAction<{
        eventId: string;
        selectionType: EditorSelectionType;
        entityId: string;
        sceneId: string;
      }>
    ) => {
      state.eventId = action.payload.eventId;
      state.dragging = DRAG_DESTINATION;
      state.type = action.payload.selectionType;
      state.entityId = action.payload.entityId;
      state.scene = action.payload.sceneId;
      state.worldFocus = true;
    },

    dragDestinationStop: (state, _action) => {
      state.eventId = "";
      state.dragging = "";
    },

    dragPlayerStart: (state, action) => {
      state.dragging = DRAG_PLAYER;
      state.worldFocus = true;
    },

    dragPlayerStop: (state, _action) => {
      state.dragging = "";
    },

    zoomIn: (
      state,
      action: PayloadAction<{ section: ZoomSection; delta?: number }>
    ) => {
      const calculateZoomIn = (oldZoom: number) => {
        return Math.min(
          800,
          action.payload.delta !== undefined
            ? oldZoom + -action.payload.delta
            : zoomIn(oldZoom)
        );
      };
      switch (action.payload.section) {
        case "world": {
          state.zoom = calculateZoomIn(state.zoom);
          break;
        }
        case "sprites": {
          state.zoomSprite = calculateZoomIn(state.zoomSprite);
          break;
        }
        case "backgrounds": {
          state.zoomImage = calculateZoomIn(state.zoomImage);
          break;
        }
        case "ui": {
          state.zoomUI = calculateZoomIn(state.zoomUI);
          break;
        }
      }
    },

    zoomOut: (
      state,
      action: PayloadAction<{ section: ZoomSection; delta?: number }>
    ) => {
      const calculateZoomOut = (oldZoom: number) => {
        return Math.max(
          25,
          action.payload.delta !== undefined
            ? oldZoom - action.payload.delta
            : zoomOut(oldZoom)
        );
      };
      switch (action.payload.section) {
        case "world": {
          state.zoom = calculateZoomOut(state.zoom);
          break;
        }
        case "sprites": {
          state.zoomSprite = calculateZoomOut(state.zoomSprite);
          break;
        }
        case "backgrounds": {
          state.zoomImage = calculateZoomOut(state.zoomImage);
          break;
        }
        case "ui": {
          state.zoomUI = calculateZoomOut(state.zoomUI);
          break;
        }
      }
    },

    zoomReset: (state, action: PayloadAction<{ section: ZoomSection }>) => {
      switch (action.payload.section) {
        case "world": {
          state.zoom = 100;
          break;
        }
        case "sprites": {
          state.zoomSprite = 100;
          break;
        }
        case "backgrounds": {
          state.zoomImage = 100;
          break;
        }
        case "ui": {
          state.zoomUI = 100;
          break;
        }
      }
    },

    resizeWorldSidebar: (state, action: PayloadAction<number>) => {
      state.worldSidebarWidth = Math.min(
        window.innerWidth - 70,
        Math.max(300, action.payload)
      );
    },

    resizeFilesSidebar: (state, action: PayloadAction<number>) => {
      state.filesSidebarWidth = Math.min(
        window.innerWidth - 70,
        Math.max(300, action.payload)
      );
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(entityActions.addScene, (state, action) => {
        state.type = "scene";
        state.scene = action.payload.sceneId;
        state.worldFocus = true;
      })
      .addCase(entityActions.moveActor, (state, action) => {
        if (state.scene !== action.payload.newSceneId) {
          state.scene = action.payload.newSceneId;
          state.worldFocus = true;
        }
      })
      .addCase(entityActions.moveTrigger, (state, action) => {
        if (state.scene !== action.payload.newSceneId) {
          state.scene = action.payload.newSceneId;
          state.worldFocus = true;
        }
      }),
});

export const { actions, reducer } = editorSlice;

export default reducer;
