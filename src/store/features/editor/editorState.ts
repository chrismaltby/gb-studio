import { createSlice, PayloadAction, AnyAction } from "@reduxjs/toolkit";
import {
  BRUSH_8PX,
  COLLISION_ALL,
  DRAG_ACTOR,
  DRAG_TRIGGER,
  DRAG_DESTINATION,
  DRAG_PLAYER,
} from "../../../consts";
import { zoomIn, zoomOut } from "lib/helpers/zoom";
import { Actor, Trigger, SceneData, Variable } from "../entities/entitiesTypes";
import navigationActions from "../navigation/navigationActions";
import projectActions from "../project/projectActions";
import settingsActions from "../settings/settingsActions";
import entitiesActions from "../entities/entitiesActions";
import spriteActions from "../sprite/spriteActions";
import { MIN_SIDEBAR_WIDTH } from "lib/helpers/window/sidebar";

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
  | "customEvent"
  | "variable";

export type ZoomSection =
  | "world"
  | "sprites"
  | "backgrounds"
  | "ui"
  | "spriteTiles";

export interface SpriteTileSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type InstrumentType = "duty" | "wave" | "noise";

export interface SelectedInstrument {
  id: string;
  type: InstrumentType;
}

export interface EditorState {
  tool: Tool;
  pasteMode: boolean;
  actorDefaults?: Partial<Actor>;
  triggerDefaults?: Partial<Trigger>;
  sceneDefaults?: Partial<SceneData>;
  clipboardVariables: Variable[];
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
  zoomSpriteTiles: number;
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
  lastScriptTabTrigger: string;
  lastScriptTabSecondary: string;
  lockScriptEditor: boolean;
  worldSidebarWidth: number;
  navigatorSidebarWidth: number;
  filesSidebarWidth: number;
  navigatorSplitSizes: number[];
  profile: boolean;
  focusSceneId: string;
  selectedSpriteSheetId: string;
  selectedSpriteStateId: string;
  selectedAnimationId: string;
  selectedMetaspriteId: string;
  selectedMetaspriteTileIds: string[];
  showSpriteGrid: boolean;
  showOnionSkin: boolean;
  playSpriteAnimation: boolean;
  spriteTileSelection?: SpriteTileSelection;
  showSpriteBoundingBox: boolean;
  replaceSpriteTileMode: boolean;
  parallaxHoverLayer: number | undefined;
  previewAsSceneId: string;
  selectedSongId: string;
  selectedInstrument: SelectedInstrument;
  selectedSequence: number;
  precisionTileMode: boolean;
}

export const initialState: EditorState = {
  tool: "select",
  pasteMode: false,
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
  zoomSpriteTiles: 400,
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
  lastScriptTabTrigger: "",
  lastScriptTabSecondary: "",
  lockScriptEditor: false,
  profile: false,
  worldSidebarWidth: 300,
  navigatorSidebarWidth: 200,
  filesSidebarWidth: 300,
  clipboardVariables: [],
  navigatorSplitSizes: [300, 100, 100],
  focusSceneId: "",
  selectedSpriteSheetId: "",
  selectedSpriteStateId: "",
  selectedAnimationId: "",
  selectedMetaspriteId: "",
  selectedMetaspriteTileIds: [],
  showSpriteGrid: true,
  showOnionSkin: false,
  playSpriteAnimation: false,
  showSpriteBoundingBox: false,
  replaceSpriteTileMode: false,
  parallaxHoverLayer: undefined,
  previewAsSceneId: "",
  selectedSongId: "",
  selectedInstrument: {
    id: "0",
    type: "duty",
  },
  selectedSequence: 0,
  precisionTileMode: false,
};

const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    setTool: (state, action: PayloadAction<{ tool: Tool }>) => {
      state.tool = action.payload.tool;
      state.actorDefaults = undefined;
      state.triggerDefaults = undefined;
      state.sceneDefaults = undefined;
      state.pasteMode = false;
    },

    setPasteMode: (state, action: PayloadAction<boolean>) => {
      state.pasteMode = action.payload;
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

    selectWorld: (state, _action: PayloadAction<void>) => {
      state.scene = "";
      state.type = "world";
      state.worldFocus = true;
    },

    selectSidebar: (state, _action: PayloadAction<void>) => {
      state.worldFocus = false;
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

    selectScriptEvent: (state, action: PayloadAction<{ eventId: string }>) => {
      state.eventId = action.payload.eventId;
    },

    selectScene: (state, action: PayloadAction<{ sceneId: string }>) => {
      state.type = "scene";
      state.scene = action.payload.sceneId;
      state.previewAsSceneId = action.payload.sceneId;
      state.worldFocus = true;
    },

    selectCustomEvent: (
      state,
      action: PayloadAction<{ customEventId: string }>
    ) => {
      state.type = "customEvent";
      state.scene = "";
      state.entityId = action.payload.customEventId;
    },

    selectVariable: (state, action: PayloadAction<{ variableId: string }>) => {
      state.type = "variable";
      state.scene = "";
      state.entityId = action.payload.variableId;
    },

    selectActor: (
      state,
      action: PayloadAction<{ actorId: string; sceneId: string }>
    ) => {
      state.type = "actor";
      state.scene = action.payload.sceneId;
      state.previewAsSceneId = action.payload.sceneId;
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
      state.previewAsSceneId = action.payload.sceneId;
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
      state.worldFocus = true;
    },

    dragTriggerStop: (state, _action: PayloadAction<void>) => {
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

    dragActorStop: (state, _action: PayloadAction<void>) => {
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

    dragDestinationStop: (state, _action: PayloadAction<void>) => {
      state.eventId = "";
      state.dragging = "";
    },

    dragPlayerStart: (state, _action: PayloadAction<void>) => {
      state.dragging = DRAG_PLAYER;
      state.worldFocus = true;
    },

    dragPlayerStop: (state, _action: PayloadAction<void>) => {
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
        case "spriteTiles": {
          state.zoomSpriteTiles = calculateZoomIn(state.zoomSpriteTiles);
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
        case "spriteTiles": {
          state.zoomSpriteTiles = calculateZoomOut(state.zoomSpriteTiles);
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
        case "spriteTiles": {
          state.zoomSpriteTiles = 400;
          break;
        }
      }
    },

    resizeWorldSidebar: (state, action: PayloadAction<number>) => {
      state.worldSidebarWidth = Math.max(action.payload, MIN_SIDEBAR_WIDTH);
    },

    resizeNavigatorSidebar: (state, action: PayloadAction<number>) => {
      state.navigatorSidebarWidth = action.payload;
    },

    resizeFilesSidebar: (state, action: PayloadAction<number>) => {
      state.filesSidebarWidth = Math.max(action.payload, MIN_SIDEBAR_WIDTH);
    },

    editSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
      state.focusSceneId = "";
    },

    setScriptTab: (state, action: PayloadAction<string>) => {
      state.lastScriptTab = action.payload;
    },

    setScriptTabScene: (state, action: PayloadAction<string>) => {
      state.lastScriptTabScene = action.payload;
    },

    setScriptTabSecondary: (state, action: PayloadAction<string>) => {
      state.lastScriptTabSecondary = action.payload;
    },

    setScriptTabTrigger: (state, action: PayloadAction<string>) => {
      state.lastScriptTabTrigger = action.payload;
    },

    setLockScriptEditor: (state, action: PayloadAction<boolean>) => {
      state.lockScriptEditor = action.payload;
    },

    setProfiling: (state, action: PayloadAction<boolean>) => {
      state.profile = action.payload;
    },

    setActorDefaults: (state, action: PayloadAction<Partial<Actor>>) => {
      state.actorDefaults = action.payload;
      state.tool = "actors";
    },

    setTriggerDefaults: (state, action: PayloadAction<Partial<Trigger>>) => {
      state.triggerDefaults = action.payload;
      state.tool = "triggers";
    },

    setSceneDefaults: (state, action: PayloadAction<Partial<SceneData>>) => {
      state.sceneDefaults = action.payload;
      state.tool = "scene";
    },

    setClipboardVariables: (state, action: PayloadAction<Variable[]>) => {
      state.clipboardVariables = action.payload;
    },

    setNavigatorSplitSizes: (state, action: PayloadAction<number[]>) => {
      state.navigatorSplitSizes = action.payload;
    },

    setFocusSceneId: (state, action: PayloadAction<string>) => {
      state.focusSceneId = action.payload;
    },

    setSelectedSpriteSheetId: (state, action: PayloadAction<string>) => {
      state.selectedSpriteSheetId = action.payload;
      state.selectedSpriteStateId = "";
      state.selectedAnimationId = "";
      state.selectedMetaspriteId = "";
      state.selectedMetaspriteTileIds = [];
      state.playSpriteAnimation = false;
      state.replaceSpriteTileMode = false;
      state.spriteTileSelection = undefined;
    },

    setSelectedAnimationId: (
      state,
      action: PayloadAction<{
        animationId: string;
        stateId: string;
      }>
    ) => {
      state.selectedAnimationId = action.payload.animationId;
      state.selectedSpriteStateId = action.payload.stateId;
      state.selectedMetaspriteId = "";
      state.selectedMetaspriteTileIds = [];
      state.playSpriteAnimation = false;
      state.replaceSpriteTileMode = false;
    },

    setSelectedMetaspriteId: (state, action: PayloadAction<string>) => {
      state.selectedMetaspriteId = action.payload;
      state.selectedMetaspriteTileIds = [];
      state.replaceSpriteTileMode = false;
    },

    setSelectedMetaspriteTileId: (state, action: PayloadAction<string>) => {
      state.selectedMetaspriteTileIds = [action.payload];
      state.playSpriteAnimation = false;
      state.replaceSpriteTileMode = false;
    },

    setSelectedMetaspriteTileIds: (state, action: PayloadAction<string[]>) => {
      state.selectedMetaspriteTileIds = action.payload;
      state.playSpriteAnimation = false;
      state.replaceSpriteTileMode = false;
    },

    resetSelectedMetaspriteTileIds: (state) => {
      state.selectedMetaspriteTileIds = [];
      state.playSpriteAnimation = false;
      state.replaceSpriteTileMode = false;
    },

    toggleSelectedMetaspriteTileId: (state, action: PayloadAction<string>) => {
      if (state.selectedMetaspriteTileIds.indexOf(action.payload) > -1) {
        // Don't remove if this is the last selected tile
        if (state.selectedMetaspriteTileIds.length > 1) {
          state.selectedMetaspriteTileIds =
            state.selectedMetaspriteTileIds.filter(
              (id) => id !== action.payload
            );
        }
      } else {
        state.selectedMetaspriteTileIds.push(action.payload);
      }
      state.playSpriteAnimation = false;
    },

    setShowOnionSkin: (state, action: PayloadAction<boolean>) => {
      state.showOnionSkin = action.payload;
    },

    setShowSpriteGrid: (state, action: PayloadAction<boolean>) => {
      state.showSpriteGrid = action.payload;
    },

    setPlaySpriteAnimation: (state, action: PayloadAction<boolean>) => {
      state.playSpriteAnimation = action.payload;
    },

    setSpriteTileSelection: (
      state,
      action: PayloadAction<SpriteTileSelection>
    ) => {
      state.spriteTileSelection = action.payload;
      state.selectedMetaspriteTileIds = [];
    },

    resetSpriteTileSelection: (state) => {
      state.spriteTileSelection = undefined;
    },

    setShowSpriteBoundingBox: (state, action: PayloadAction<boolean>) => {
      state.showSpriteBoundingBox = action.payload;
    },

    setReplaceSpriteTileMode: (state, action: PayloadAction<boolean>) => {
      state.replaceSpriteTileMode = action.payload;
    },

    setParallaxHoverLayer: (
      state,
      action: PayloadAction<number | undefined>
    ) => {
      state.parallaxHoverLayer = action.payload;
    },

    setPreviewAsSceneId: (state, action: PayloadAction<string>) => {
      state.previewAsSceneId = action.payload;
    },

    setSelectedSongId: (state, action: PayloadAction<string>) => {
      state.selectedSongId = action.payload;
      state.selectedInstrument = { id: "0", type: "duty" };
      state.selectedSequence = 0;
    },

    setSelectedInstrument: (
      state,
      action: PayloadAction<SelectedInstrument>
    ) => {
      state.selectedInstrument = action.payload;
    },

    setSelectedSequence: (state, action: PayloadAction<number>) => {
      state.selectedSequence = action.payload;
    },

    setPrecisionTileMode: (state, action: PayloadAction<boolean>) => {
      state.precisionTileMode = action.payload;
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(entitiesActions.addScene, (state, action) => {
        state.type = "scene";
        state.scene = action.payload.sceneId;
        state.worldFocus = true;
      })
      .addCase(entitiesActions.addActor, (state, action) => {
        state.type = "actor";
        state.scene = action.payload.sceneId;
        state.entityId = action.payload.actorId;
        state.worldFocus = true;
      })
      .addCase(entitiesActions.addTrigger, (state, action) => {
        state.type = "trigger";
        state.scene = action.payload.sceneId;
        state.entityId = action.payload.triggerId;
        state.worldFocus = true;
      })
      .addCase(entitiesActions.addMetasprite, (state, action) => {
        state.selectedMetaspriteId = action.payload.metaspriteId;
        state.selectedMetaspriteTileIds = [];
      })
      .addCase(entitiesActions.cloneMetasprite, (state, action) => {
        state.selectedMetaspriteId = action.payload.newMetaspriteId;
        state.selectedMetaspriteTileIds = [];
      })
      .addCase(entitiesActions.addMetaspriteTile, (state, _action) => {
        state.spriteTileSelection = undefined;
      })
      .addCase(entitiesActions.addSpriteState, (state, action) => {
        state.selectedSpriteStateId = action.payload.spriteStateId;
        state.selectedAnimationId = "";
        state.selectedMetaspriteTileIds = [];
      })
      .addCase(entitiesActions.addCustomEvent, (state, action) => {
        if (!action.payload.defaults) {
          state.type = "customEvent";
          state.scene = "";
          state.entityId = action.payload.customEventId;
        }
      })
      .addCase(entitiesActions.moveActor, (state, action) => {
        if (state.scene !== action.payload.newSceneId) {
          state.scene = action.payload.newSceneId;
          state.worldFocus = true;
        }
      })
      .addCase(entitiesActions.moveTrigger, (state, action) => {
        if (state.scene !== action.payload.newSceneId) {
          state.scene = action.payload.newSceneId;
          state.worldFocus = true;
        }
      })
      .addCase(entitiesActions.removeMetasprite, (state, _action) => {
        state.selectedMetaspriteId = "";
        state.selectedMetaspriteTileIds = [];
      })
      .addCase(entitiesActions.removeSpriteState, (state, _action) => {
        state.selectedSpriteStateId = "";
        state.selectedAnimationId = "";
        state.selectedMetaspriteId = "";
        state.selectedMetaspriteTileIds = [];
      })
      // Set to world editor when moving player start position
      .addCase(settingsActions.editPlayerStartAt, (state, action) => {
        state.scene = action.payload.sceneId;
        state.type = "scene";
        state.worldFocus = true;
      })
      // Force React Select dropdowns to reload with new name
      .addCase(entitiesActions.renameVariable, (state, _action) => {
        state.variableVersion = state.variableVersion + 1;
      })
      // Remove world focus when switching section
      .addCase(navigationActions.setSection, (state, _action) => {
        state.worldFocus = false;
        state.eventId = "";
      })
      // Remove world focus when loading project and set scroll settings from project
      .addCase(projectActions.loadProject.fulfilled, (state, action) => {
        state.worldFocus = false;
        state.zoom = action.payload.data.settings?.zoom || state.zoom;
        state.worldScrollX =
          action.payload.data.settings?.worldScrollX || state.worldScrollX;
        state.worldScrollY =
          action.payload.data.settings?.worldScrollY || state.worldScrollY;
        if (
          initialState.navigatorSplitSizes.length ===
          action.payload.data.settings?.navigatorSplitSizes?.length
        ) {
          // Only use navigatorSplitSizes if correct number of splits provided
          state.navigatorSplitSizes =
            action.payload.data.settings?.navigatorSplitSizes ||
            state.navigatorSplitSizes;
        }
      })
      .addCase(spriteActions.detectSpriteComplete, (state, action) => {
        state.selectedAnimationId = action.payload.spriteAnimations[0].id;
        state.selectedMetaspriteId =
          action.payload.spriteAnimations[0].frames[0];
      })
      // When UI changes increment UI version number
      .addMatcher(
        (action): action is AnyAction =>
          projectActions.loadUI.match(action) ||
          projectActions.reloadAssets.match(action),
        (state) => {
          state.uiVersion = state.uiVersion + 1;
        }
      )
      // When painting collisions or tiles select scene being drawn on
      .addMatcher(
        (action): action is PayloadAction<{ sceneId: string }> =>
          entitiesActions.paintCollision.match(action) ||
          entitiesActions.paintColor.match(action),
        (state, action) => {
          state.type = "scene";
          state.scene = action.payload.sceneId;
          state.worldFocus = true;
        }
      ),
});

export const { actions, reducer } = editorSlice;

export default reducer;
