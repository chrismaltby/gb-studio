import {
  createSlice,
  PayloadAction,
  UnknownAction,
  createSelector,
  ThunkDispatch,
} from "@reduxjs/toolkit";
import {
  BRUSH_8PX,
  COLLISION_ALL,
  DRAG_ACTOR,
  DRAG_TRIGGER,
  DRAG_DESTINATION,
  DRAG_PLAYER,
  BRUSH_SLOPE,
} from "consts";
import { zoomIn, zoomOut } from "shared/lib/helpers/zoom";
import {
  ScriptEventParentType,
  Variable,
} from "shared/lib/entities/entitiesTypes";
import navigationActions from "store/features/navigation/navigationActions";
import projectActions from "store/features/project/projectActions";
import settingsActions from "store/features/settings/settingsActions";
import entitiesActions from "store/features/entities/entitiesActions";
import spriteActions from "store/features/sprite/spriteActions";
import { MIN_SIDEBAR_WIDTH } from "renderer/lib/window/sidebar";
import type { NavigationSection } from "store/features/navigation/navigationState";
import type { RootState } from "store/configureStore";
import { addNewSongFile } from "store/features/trackerDocument/trackerDocumentState";
import { selectScriptIds } from "store/features/entities/entitiesState";

export type Tool =
  | "triggers"
  | "actors"
  | "collisions"
  | "colors"
  | "scene"
  | "eraser"
  | "select";

export type Brush = "8px" | "16px" | "fill" | "magic" | "slope";

export type EditorSelectionType =
  | "world"
  | "scene"
  | "actor"
  | "trigger"
  | "customEvent"
  | "variable"
  | "constant"
  | "actorPrefab"
  | "triggerPrefab";

export const zoomSections = [
  "world",
  "sprites",
  "backgrounds",
  "ui",
  "spriteTiles",
] as const;

export type ZoomSection = (typeof zoomSections)[number];

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

export type SlopeIncline = "medium" | "shallow" | "steep";

export interface SlopePreview {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  offset: boolean;
  slopeIncline: SlopeIncline;
}

export interface EditorState {
  tool: Tool;
  pasteMode: boolean;
  clipboardVariables: Variable[];
  type: EditorSelectionType;
  worldFocus: boolean;
  scene: string;
  entityId: string;
  eventId: string;
  sceneSelectionIds: string[];
  scriptEventSelectionIds: string[];
  scriptEventSelectionParentId: string;
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
    x: number;
    y: number;
  };
  worldScrollX: number;
  worldScrollY: number;
  worldViewWidth: number;
  worldViewHeight: number;
  selectedPalette: number;
  selectedTileType: number;
  selectedTileMask: number;
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
  navigatorSplitSizesManuallyEdited: boolean;
  focusSceneId: string;
  selectedSpriteSheetId: string;
  selectedSpriteStateId: string;
  selectedAnimationId: string;
  selectedMetaspriteId: string;
  selectedAdditionalMetaspriteIds: string[];
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
  slopePreview?: SlopePreview;
  showScriptUses: boolean;
  prefabId: string;
}

export const initialState: EditorState = {
  tool: "select",
  pasteMode: false,
  type: "world",
  worldFocus: false,
  scene: "",
  entityId: "",
  eventId: "",
  sceneSelectionIds: [],
  scriptEventSelectionIds: [],
  scriptEventSelectionParentId: "",
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
    x: 0,
    y: 0,
  },
  worldScrollX: 0,
  worldScrollY: 0,
  worldViewWidth: 0,
  worldViewHeight: 0,
  selectedPalette: 0,
  selectedTileType: COLLISION_ALL,
  selectedTileMask: 0xFF,
  selectedBrush: BRUSH_8PX,
  showLayers: true,
  lastScriptTab: "",
  lastScriptTabScene: "",
  lastScriptTabTrigger: "",
  lastScriptTabSecondary: "",
  lockScriptEditor: false,
  worldSidebarWidth: 300,
  navigatorSidebarWidth: 200,
  filesSidebarWidth: 300,
  clipboardVariables: [],
  navigatorSplitSizes: [400, 30, 30, 30, 30],
  navigatorSplitSizesManuallyEdited: false,
  focusSceneId: "",
  selectedSpriteSheetId: "",
  selectedSpriteStateId: "",
  selectedAnimationId: "",
  selectedMetaspriteId: "",
  selectedAdditionalMetaspriteIds: [],
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
  slopePreview: undefined,
  showScriptUses: false,
  prefabId: "",
};

const toggleScriptEventSelectedId =
  (action: {
    scriptEventId: string;
    parentType: ScriptEventParentType;
    parentId: string;
    parentKey: string;
  }) =>
  (
    dispatch: ThunkDispatch<RootState, unknown, UnknownAction>,
    getState: () => RootState,
  ) => {
    const state = getState();
    const siblingIds = selectScriptIds(
      state.project.present.entities,
      action.parentType,
      action.parentId,
      action.parentKey,
    );
    const selectionIds = state.editor.scriptEventSelectionIds.slice();
    const selectionParentId = state.editor.scriptEventSelectionParentId;
    const parentId = `${action.parentType}_${action.parentId}_${action.parentKey}`;

    if (siblingIds) {
      if (selectionParentId !== parentId) {
        // Selected from new parent, change selection to just this script event
        dispatch(
          actions.setScriptEventSelectedIds({
            scriptEventIds: [action.scriptEventId],
            parentId,
          }),
        );
      } else {
        // Same parent id so toggle if event is selected or not
        const index = selectionIds.indexOf(action.scriptEventId);
        if (index === -1) {
          // Add to selection
          selectionIds.push(action.scriptEventId);
        } else {
          // Remove from selection
          selectionIds.splice(index, 1);
        }
        // Sort to keep order of siblings
        const sortedIds = selectionIds.slice().sort((a, b) => {
          const indexA = siblingIds.findIndex((item) => item === a);
          const indexB = siblingIds.findIndex((item) => item === b);
          return indexA - indexB;
        });
        dispatch(
          actions.setScriptEventSelectedIds({
            scriptEventIds: sortedIds,
            parentId,
          }),
        );
      }
    }
  };

const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    setTool: (state, action: PayloadAction<{ tool: Tool }>) => {
      state.tool = action.payload.tool;
      state.pasteMode = false;
      state.prefabId = "";
      // Reset to 8px brush is current brush not supported
      if (
        state.selectedBrush === BRUSH_SLOPE &&
        action.payload.tool !== "collisions"
      ) {
        state.selectedBrush = BRUSH_8PX;
      }
    },

    setPasteMode: (state, action: PayloadAction<boolean>) => {
      state.pasteMode = action.payload;
    },

    setBrush: (state, action: PayloadAction<{ brush: Brush }>) => {
      state.selectedBrush = action.payload.brush;
    },

    setSelectedPalette: (
      state,
      action: PayloadAction<{ paletteIndex: number }>,
    ) => {
      state.selectedPalette = action.payload.paletteIndex;
    },

    setSelectedTileType: (
      state,
      action: PayloadAction<{ tileType: number, tileMask: number }>,
    ) => {
      state.selectedTileType = action.payload.tileType;
      state.selectedTileMask = action.payload.tileMask;
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
      action: PayloadAction<{ width: number; height: number }>,
    ) => {
      state.worldViewWidth = action.payload.width;
      state.worldViewHeight = action.payload.height;
    },

    selectWorld: (state, _action: PayloadAction<void>) => {
      state.scene = "";
      state.type = "world";
      state.worldFocus = true;
      state.sceneSelectionIds = [];
    },

    selectSidebar: (state, _action: PayloadAction<void>) => {
      state.worldFocus = false;
      if (
        state.tool === "actors" ||
        state.tool === "triggers" ||
        state.tool === "scene"
      ) {
        state.tool = "select";
      }
    },

    sceneHover: (
      state,
      action: PayloadAction<{ sceneId: string; x: number; y: number }>,
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
      state.entityId = "";
      if (!state.sceneSelectionIds.includes(state.scene)) {
        state.sceneSelectionIds = [action.payload.sceneId];
      }
      state.scriptEventSelectionIds = [];
    },

    selectActorPrefab: (
      state,
      action: PayloadAction<{ actorPrefabId: string }>,
    ) => {
      state.type = "actorPrefab";
      state.scene = "";
      state.entityId = action.payload.actorPrefabId;
    },

    selectTriggerPrefab: (
      state,
      action: PayloadAction<{ triggerPrefabId: string }>,
    ) => {
      state.type = "triggerPrefab";
      state.scene = "";
      state.entityId = action.payload.triggerPrefabId;
    },

    selectCustomEvent: (
      state,
      action: PayloadAction<{ customEventId: string }>,
    ) => {
      state.type = "customEvent";
      state.scene = "";
      state.entityId = action.payload.customEventId;
      state.scriptEventSelectionIds = [];
    },

    selectVariable: (state, action: PayloadAction<{ variableId: string }>) => {
      state.type = "variable";
      state.scene = "";
      state.entityId = action.payload.variableId;
    },

    selectConstant: (state, action: PayloadAction<{ constantId: string }>) => {
      state.type = "constant";
      state.scene = "";
      state.entityId = action.payload.constantId;
    },

    selectActor: (
      state,
      action: PayloadAction<{ actorId: string; sceneId: string }>,
    ) => {
      state.type = "actor";
      state.scene = action.payload.sceneId;
      state.previewAsSceneId = action.payload.sceneId;
      state.entityId = action.payload.actorId;
      state.worldFocus = true;
      state.tool = "select";
      if (!state.sceneSelectionIds.includes(state.scene)) {
        state.sceneSelectionIds = [action.payload.sceneId];
      }
      state.scriptEventSelectionIds = [];
    },

    selectTrigger: (
      state,
      action: PayloadAction<{ triggerId: string; sceneId: string }>,
    ) => {
      state.type = "trigger";
      state.scene = action.payload.sceneId;
      state.previewAsSceneId = action.payload.sceneId;
      state.entityId = action.payload.triggerId;
      state.worldFocus = true;
      state.tool = "select";
      if (!state.sceneSelectionIds.includes(state.scene)) {
        state.sceneSelectionIds = [action.payload.sceneId];
      }
      state.scriptEventSelectionIds = [];
    },

    dragTriggerStart: (
      state,
      action: PayloadAction<{ triggerId: string; sceneId: string }>,
    ) => {
      state.type = "trigger";
      state.dragging = DRAG_TRIGGER;
      state.entityId = action.payload.triggerId;
      state.scene = action.payload.sceneId;
      state.worldFocus = true;
      if (!state.sceneSelectionIds.includes(state.scene)) {
        state.sceneSelectionIds = [action.payload.sceneId];
      }
      state.scriptEventSelectionIds = [];
    },

    dragTriggerStop: (state, _action: PayloadAction<void>) => {
      state.dragging = "";
    },

    dragActorStart: (
      state,
      action: PayloadAction<{ actorId: string; sceneId: string }>,
    ) => {
      state.type = "actor";
      state.dragging = DRAG_ACTOR;
      state.entityId = action.payload.actorId;
      state.scene = action.payload.sceneId;
      state.worldFocus = true;
      if (!state.sceneSelectionIds.includes(state.scene)) {
        state.sceneSelectionIds = [action.payload.sceneId];
      }
      state.scriptEventSelectionIds = [];
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
      }>,
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
      action: PayloadAction<{ section: ZoomSection; delta?: number }>,
    ) => {
      const calculateZoomIn = (oldZoom: number) => {
        return Math.min(
          800,
          action.payload.delta !== undefined
            ? oldZoom + action.payload.delta
            : zoomIn(oldZoom),
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
      action: PayloadAction<{ section: ZoomSection; delta?: number }>,
    ) => {
      const calculateZoomOut = (oldZoom: number) => {
        return Math.max(
          25,
          action.payload.delta !== undefined
            ? oldZoom - action.payload.delta
            : zoomOut(oldZoom),
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
      state.sceneSelectionIds = [];
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

    setClipboardVariables: (state, action: PayloadAction<Variable[]>) => {
      state.clipboardVariables = action.payload;
    },

    setNavigatorSplitSizes: (
      state,
      action: PayloadAction<{ sizes: number[]; manuallyEdited: boolean }>,
    ) => {
      state.navigatorSplitSizes = action.payload.sizes;
      state.navigatorSplitSizesManuallyEdited = action.payload.manuallyEdited;
    },

    setFocusSceneId: (state, action: PayloadAction<string>) => {
      state.focusSceneId = action.payload;
    },

    setSelectedSpriteSheetId: (state, action: PayloadAction<string>) => {
      state.selectedSpriteSheetId = action.payload;
      state.selectedSpriteStateId = "";
      state.selectedAnimationId = "";
      state.selectedMetaspriteId = "";
      state.selectedAdditionalMetaspriteIds = [];
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
      }>,
    ) => {
      state.selectedAnimationId = action.payload.animationId;
      state.selectedSpriteStateId = action.payload.stateId;
      state.selectedMetaspriteId = "";
      state.selectedAdditionalMetaspriteIds = [];
      state.selectedMetaspriteTileIds = [];
      state.playSpriteAnimation = false;
      state.replaceSpriteTileMode = false;
    },

    setSelectedMetaspriteId: (state, action: PayloadAction<string>) => {
      if (!state.selectedAdditionalMetaspriteIds.includes(action.payload)) {
        state.selectedAdditionalMetaspriteIds = [action.payload];
      }
      state.selectedMetaspriteId = action.payload;

      state.selectedMetaspriteTileIds = [];
      state.replaceSpriteTileMode = false;
    },

    toggleMultiSelectedMetaspriteId: (state, action: PayloadAction<string>) => {
      // Don't remove if this is the current metasprite
      if (action.payload === state.selectedMetaspriteId) {
        return;
      }
      if (state.selectedAdditionalMetaspriteIds.indexOf(action.payload) > -1) {
        state.selectedAdditionalMetaspriteIds =
          state.selectedAdditionalMetaspriteIds.filter(
            (id) => id !== action.payload,
          );
      } else {
        if (state.selectedAdditionalMetaspriteIds.length === 0) {
          // If no multiselection currently set selected metasprite to this
          // fixes issue when making a multi selection when when no frame selected
          // e.g when IDE is defaulting to first frame after selecting sprite
          state.selectedMetaspriteId = action.payload;
        }
        state.selectedAdditionalMetaspriteIds.push(action.payload);
      }
      state.playSpriteAnimation = false;
    },

    addMetaspriteIdsToMultiSelection: (
      state,
      action: PayloadAction<string[]>,
    ) => {
      for (const frame of action.payload) {
        if (state.selectedAdditionalMetaspriteIds.indexOf(frame) === -1) {
          if (state.selectedAdditionalMetaspriteIds.length === 0) {
            // If no multiselection currently set selected metasprite to this
            // fixes issue when making a multi selection when when no frame selected
            // e.g when IDE is defaulting to first frame after selecting sprite
            state.selectedMetaspriteId = frame;
          }
          state.selectedAdditionalMetaspriteIds.push(frame);
        }
      }
      state.playSpriteAnimation = false;
    },

    clearMultiSelectedMetaspriteId: (state) => {
      state.selectedAdditionalMetaspriteIds = state.selectedMetaspriteId
        ? [state.selectedMetaspriteId]
        : [];
      state.playSpriteAnimation = false;
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
              (id) => id !== action.payload,
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
      action: PayloadAction<SpriteTileSelection>,
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
      action: PayloadAction<number | undefined>,
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
      action: PayloadAction<SelectedInstrument>,
    ) => {
      state.selectedInstrument = action.payload;
    },

    setSelectedSequence: (state, action: PayloadAction<number>) => {
      state.selectedSequence = action.payload;
    },

    setPrecisionTileMode: (state, action: PayloadAction<boolean>) => {
      state.precisionTileMode = action.payload;
    },

    setSlopePreview: (
      state,
      action: PayloadAction<{
        sceneId: string;
        slopePreview?: SlopePreview;
      }>,
    ) => {
      state.scene = action.payload.sceneId;
      state.slopePreview = action.payload.slopePreview;
    },

    setSceneSelectionIds: (state, action: PayloadAction<string[]>) => {
      state.sceneSelectionIds = action.payload;
      // Also focus on first scene in array
      if (state.sceneSelectionIds.length > 0) {
        state.scene = state.sceneSelectionIds[0];
        state.type = "scene";
        state.worldFocus = true;
      }
    },

    addSceneSelectionIds: (state, action: PayloadAction<string[]>) => {
      state.sceneSelectionIds = [
        ...state.sceneSelectionIds,
        ...action.payload,
      ].filter((id, index, self) => {
        return self.indexOf(id) === index;
      });
      // If not currently in scene mode switch to selecting the first selected scene
      if (state.type !== "scene" && state.sceneSelectionIds.length > 0) {
        state.scene = state.sceneSelectionIds[0];
        state.type = "scene";
        state.worldFocus = true;
      }
    },

    removeSceneSelectionIds: (state, action: PayloadAction<string[]>) => {
      state.sceneSelectionIds = state.sceneSelectionIds.filter((id) => {
        return action.payload.indexOf(id) === -1;
      });
    },

    toggleSceneSelectedId: (state, action: PayloadAction<string>) => {
      // If toggling focused scene id then remove scene selection
      if (state.scene === action.payload) {
        state.scene = "";
        state.type = "world";
        state.worldFocus = true;
        state.sceneSelectionIds = state.sceneSelectionIds.filter((id) => {
          return action.payload.indexOf(id) === -1;
        });
      } else {
        const index = state.sceneSelectionIds.indexOf(action.payload);
        if (index === -1) {
          state.sceneSelectionIds.push(action.payload);
          // If not currently in scene mode switch to selecting this scene
          if (state.type !== "scene") {
            state.scene = action.payload;
            state.type = "scene";
            state.worldFocus = true;
          }
        } else {
          state.sceneSelectionIds.splice(index, 1);
        }
      }
    },

    clearSceneSelectionIds: (state) => {
      state.sceneSelectionIds = [];
    },

    setScriptEventSelectedIds: (
      state,
      action: PayloadAction<{ scriptEventIds: string[]; parentId: string }>,
    ) => {
      state.scriptEventSelectionIds = action.payload.scriptEventIds;
      state.scriptEventSelectionParentId = action.payload.parentId;
    },

    clearScriptEventSelectionIds: (state) => {
      state.scriptEventSelectionIds = [];
      state.scriptEventSelectionParentId = "";
    },

    setShowScriptUses: (state, action: PayloadAction<boolean>) => {
      state.showScriptUses = action.payload;
    },

    setPrefabId: (state, action: PayloadAction<string>) => {
      state.prefabId = action.payload;
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(entitiesActions.addScene, (state, action) => {
        state.type = "scene";
        state.scene = action.payload.sceneId;
        state.entityId = "";
        state.worldFocus = true;
        state.sceneSelectionIds = [action.payload.sceneId];
        state.scriptEventSelectionIds = [];
      })
      .addCase(entitiesActions.addActor, (state, action) => {
        state.type = "actor";
        state.scene = action.payload.sceneId;
        state.entityId = action.payload.actorId;
        state.worldFocus = true;
        if (!state.sceneSelectionIds.includes(state.scene)) {
          state.sceneSelectionIds = [action.payload.sceneId];
        }
        state.scriptEventSelectionIds = [];
      })
      .addCase(entitiesActions.addTrigger, (state, action) => {
        state.type = "trigger";
        state.scene = action.payload.sceneId;
        state.entityId = action.payload.triggerId;
        state.worldFocus = true;
        if (!state.sceneSelectionIds.includes(state.scene)) {
          state.sceneSelectionIds = [action.payload.sceneId];
        }
        state.scriptEventSelectionIds = [];
      })
      .addCase(entitiesActions.addMetasprite, (state, action) => {
        state.selectedMetaspriteId = action.payload.metaspriteId;
        state.selectedAdditionalMetaspriteIds = [action.payload.metaspriteId];
        state.selectedMetaspriteTileIds = [];
      })
      .addCase(entitiesActions.cloneMetasprites, (state, action) => {
        state.selectedMetaspriteId = action.payload.newMetaspriteIds[0];
        state.selectedAdditionalMetaspriteIds = [
          action.payload.newMetaspriteIds[0],
        ];
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
      .addCase(entitiesActions.addActorPrefab, (state, action) => {
        if (!action.payload.defaults) {
          state.type = "actorPrefab";
          state.scene = "";
          state.entityId = action.payload.actorPrefabId;
        }
      })
      .addCase(entitiesActions.addTriggerPrefab, (state, action) => {
        if (!action.payload.defaults) {
          state.type = "triggerPrefab";
          state.scene = "";
          state.entityId = action.payload.triggerPrefabId;
        }
      })
      .addCase(entitiesActions.addConstant, (state, action) => {
        state.type = "constant";
        state.scene = "";
        state.entityId = action.payload.constantId;
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
        state.selectedAdditionalMetaspriteIds = [];
        state.selectedMetaspriteTileIds = [];
      })
      .addCase(entitiesActions.removeSpriteState, (state, _action) => {
        state.selectedSpriteStateId = "";
        state.selectedAnimationId = "";
        state.selectedMetaspriteId = "";
        state.selectedAdditionalMetaspriteIds = [];
        state.selectedMetaspriteTileIds = [];
      })
      // Set to world editor when moving player start position
      .addCase(settingsActions.editPlayerStartAt, (state, action) => {
        state.scene = action.payload.sceneId;
        state.type = "scene";
        state.entityId = "";
        state.worldFocus = true;
        if (!state.sceneSelectionIds.includes(state.scene)) {
          state.sceneSelectionIds = [action.payload.sceneId];
        }
      })
      // Force React Select dropdowns to reload with new name
      .addCase(entitiesActions.renameVariable, (state, _action) => {
        state.variableVersion = state.variableVersion + 1;
      })
      // Remove world focus when switching section
      .addCase(navigationActions.setSection, (state, _action) => {
        state.worldFocus = false;
        state.eventId = "";
        state.scriptEventSelectionIds = [];
      })
      // Remove world focus when loading project and set scroll settings from project
      .addCase(projectActions.loadProject.fulfilled, (state, action) => {
        state.worldFocus = false;
        state.zoom = action.payload.resources.settings?.zoom || state.zoom;
        state.worldScrollX =
          action.payload.resources.settings?.worldScrollX || state.worldScrollX;
        state.worldScrollY =
          action.payload.resources.settings?.worldScrollY || state.worldScrollY;
        if (
          initialState.navigatorSplitSizes.length ===
          action.payload.resources.settings?.navigatorSplitSizes?.length
        ) {
          // Only use navigatorSplitSizes if correct number of splits provided
          state.navigatorSplitSizes =
            action.payload.resources.settings?.navigatorSplitSizes ||
            state.navigatorSplitSizes;
        }
      })
      .addCase(spriteActions.detectSpriteComplete, (state, action) => {
        state.selectedAnimationId = action.payload.spriteAnimations[0].id;
        state.selectedMetaspriteId =
          action.payload.spriteAnimations[0].frames[0];
        state.selectedAdditionalMetaspriteIds = [state.selectedMetaspriteId];
      })
      // When painting slope stop slope preview
      .addCase(entitiesActions.paintSlopeCollision, (state) => {
        state.slopePreview = undefined;
      })
      // When adding a new song file jump to it in navigator
      .addCase(addNewSongFile.fulfilled, (state, action) => {
        state.selectedSongId = action.payload.data.id;
      })
      // When grouping script events remove selection
      .addCase(entitiesActions.groupScriptEvents, (state) => {
        state.scriptEventSelectionIds = [];
        state.scriptEventSelectionParentId = "";
      })
      // When adding new script events remove selection
      .addCase(entitiesActions.addScriptEvents, (state) => {
        state.scriptEventSelectionIds = [];
        state.scriptEventSelectionParentId = "";
      })
      // When UI changes increment UI version number
      .addMatcher(
        (action): action is UnknownAction =>
          projectActions.loadUI.match(action) ||
          projectActions.reloadAssets.match(action),
        (state) => {
          state.uiVersion = state.uiVersion + 1;
        },
      )
      // When painting collisions or tiles select scene being drawn on
      .addMatcher(
        (action): action is PayloadAction<{ sceneId: string }> =>
          entitiesActions.paintCollision.match(action) ||
          entitiesActions.paintColor.match(action),
        (state, action) => {
          state.type = "scene";
          state.scene = action.payload.sceneId;
          state.entityId = "";
          state.worldFocus = true;
          if (!state.sceneSelectionIds.includes(state.scene)) {
            state.sceneSelectionIds = [action.payload.sceneId];
          }
        },
      ),
});

export const { reducer } = editorSlice;

export const actions = {
  ...editorSlice.actions,
  toggleScriptEventSelectedId,
};

/**************************************************************************
 * Selectors
 */

const selectSelf = (state: RootState) => state.editor;

export const getZoomForSection = createSelector(
  [selectSelf, (_state: RootState, section: NavigationSection) => section],
  (state, section) => {
    if (section === "world") {
      return state.zoom;
    }
    if (section === "sprites") {
      return state.zoomSprite;
    }
    if (section === "backgrounds") {
      return state.zoomImage;
    }
    return 100;
  },
);

export default reducer;
