import initialState from "./initialState";
import {
  PROJECT_LOAD_SUCCESS,
  SET_SECTION,
  SELECT_SCENE,
  ADD_TRIGGER,
  SELECT_TRIGGER,
  ADD_ACTOR,
  SELECT_ACTOR,
  SELECT_SCRIPT_EVENT,
  ADD_SCENE,
  MOVE_SCENE,
  DRAG_SCENE,
  DRAG_SCENE_START,
  DRAG_SCENE_STOP,
  DRAG_PLAYER_START,
  DRAG_PLAYER_STOP,
  DRAG_DESTINATION_START,
  DRAG_DESTINATION_STOP,
  DRAG_TRIGGER_START,
  DRAG_TRIGGER_STOP,
  SCENE_HOVER,
  ACTOR_HOVER,
  SELECT_WORLD,
  EDIT_SEARCH_TERM,
  REMOVE_SCENE,
  REMOVE_ACTOR,
  REMOVE_ACTOR_AT,
  MOVE_ACTOR,
  REMOVE_TRIGGER,
  REMOVE_TRIGGER_AT,
  MOVE_TRIGGER,
  EDIT_PLAYER_START_AT,
  EDIT_UI,
  SELECT_SIDEBAR,
  PAINT_COLLISION_TILE,
  PAINT_COLLISION_LINE,
  PAINT_COLLISION_FILL,
  PAINT_COLOR_TILE,
  PAINT_COLOR_LINE,
  PAINT_COLOR_FILL,    
  SELECT_CUSTOM_EVENT,
  ADD_CUSTOM_EVENT,
  REMOVE_CUSTOM_EVENT,
  RELOAD_ASSETS,
  RENAME_VARIABLE,
  RESIZE_WORLD_VIEW,
  SET_SELECTED_PALETTE,
  SET_SELECTED_TILE_TYPE,  
  SET_SELECTED_BRUSH,
  SET_SHOW_LAYERS,
  SET_SCRIPT_TAB,
  SET_SCRIPT_TAB_SCENE,
  SET_SCRIPT_TAB_SECONDARY,
  SET_PROFILING
} from "../actions/actionTypes";

export const DRAG_PLAYER = "DRAG_PLAYER";
export const DRAG_DESTINATION = "DRAG_DESTINATION";
export const DRAG_ACTOR = "DRAG_ACTOR";
export const DRAG_TRIGGER = "DRAG_TRIGGER";

export default function editor(state = initialState.editor, action) {
  switch (action.type) {
    case PROJECT_LOAD_SUCCESS: {
      return Object.assign(
        {},
        state,
        {
          worldFocus: false
        },
        action.data.settings &&
          action.data.settings.zoom && {
            zoom: action.data.settings.zoom
          },
        action.data.settings &&
          action.data.settings.worldScrollX && 
          action.data.settings.worldScrollY && {
            worldScrollX: action.data.settings.worldScrollX,
            worldScrollY: action.data.settings.worldScrollY,
            worldScrollThrottledX: action.data.settings.worldScrollX,
            worldScrollThrottledY: action.data.settings.worldScrollY
          }          
      );
    }
    case SET_SECTION: {
      return {
        ...state,
        worldFocus: false,
        eventId: null
      };
    }
    case SELECT_SIDEBAR: {
      return {
        ...state,
        worldFocus: false
      };
    }
    case MOVE_SCENE: {
      return {
        ...state,
        type: "scenes",
        scene: action.sceneId,
        worldFocus: true
      };
    }
    case SELECT_SCENE: {
      return {
        ...state,
        type: "scenes",
        scene: action.sceneId,
        worldFocus: true
      };
    }
    case ADD_SCENE: {
      return {
        ...state,
        type: "scenes",
        scene: action.id,
        worldFocus: true
      };
    }
    case ADD_TRIGGER: {
      return {
        ...state,
        type: "triggers",
        scene: action.sceneId,
        entityId: action.id,
        worldFocus: true
      };
    }
    case SELECT_TRIGGER: {
      return {
        ...state,
        type: "triggers",
        scene: action.sceneId,
        entityId: action.id,
        worldFocus: true
      };
    }
    case ADD_ACTOR: {
      return {
        ...state,
        type: "actors",
        scene: action.sceneId,
        entityId: action.id,
        worldFocus: true
      };
    }
    case SELECT_ACTOR: {
      return {
        ...state,
        type: "actors",
        scene: action.sceneId,
        entityId: action.id
      };
    }
    case SELECT_SCRIPT_EVENT: {
      return {
        ...state,
        eventId: action.eventId
      };
    }
    case SELECT_CUSTOM_EVENT: {
      return {
        ...state,
        type: "customEvents",
        scene: "",
        entityId: action.id
      };
    }
    case ADD_CUSTOM_EVENT: {
      return {
        ...state,
        type: "customEvents",
        entityId: action.id
      };
    }
    case DRAG_SCENE_START: {
      return {
        ...state,
        sceneDragging: true,
        sceneDragX: 0,
        sceneDragY: 0
      };
    }
    case DRAG_SCENE_STOP: {
      return {
        ...state,
        sceneDragging: false,
        sceneDragX: 0,
        sceneDragY: 0
      };
    }
    case DRAG_SCENE: {
      return {
        ...state,
        sceneDragX: action.moveX,
        sceneDragY: action.moveY
      };
    }
    case DRAG_PLAYER_START: {
      return {
        ...state,
        playerDragging: true,
        dragging: DRAG_PLAYER,
        worldFocus: true
      };
    }
    case DRAG_PLAYER_STOP: {
      return {
        ...state,
        playerDragging: false,
        dragging: ""
      };
    }
    case DRAG_DESTINATION_START: {
      return {
        ...state,
        eventId: action.eventId,
        dragging: DRAG_DESTINATION,
        type: action.selectionType,
        entityId: action.id,
        scene: action.sceneId,
        worldFocus: true
      };
    }
    case DRAG_DESTINATION_STOP: {
      return {
        ...state,
        eventId: null,
        dragging: ""
      };
    }
    case DRAG_TRIGGER_START: {
      return {
        ...state,
        type: "triggers",
        triggerDragging: true,
        dragging: DRAG_TRIGGER,
        entityId: action.id,
        scene: action.sceneId
      };
    }
    case DRAG_TRIGGER_STOP: {
      return {
        ...state,
        triggerDragging: null,
        dragging: ""
      };
    }
    case SCENE_HOVER: {
      return {
        ...state,
        hover: {
          sceneId: action.sceneId,
          x: action.x,
          y: action.y
        },
        eventId: state.dragging === "" ? "" : state.eventId
      };
    }
    case ACTOR_HOVER: {
      return {
        ...state,
        hover: {
          sceneId: action.sceneId,
          actorId: action.id,
          x: action.x,
          y: action.y
        }
      };
    }
    case MOVE_ACTOR: {
      if (state.scene !== action.newSceneId) {
        return {
          ...state,
          scene: action.newSceneId,
          worldFocus: true
        };
      }
      return state;
    }
    case MOVE_TRIGGER: {
      return {
        ...state,
        scene: action.newSceneId
      };
    }
    case REMOVE_SCENE:
    case REMOVE_ACTOR:
    case REMOVE_TRIGGER:
    case REMOVE_CUSTOM_EVENT:
    case REMOVE_ACTOR_AT:
    case REMOVE_TRIGGER_AT:
    case EDIT_PLAYER_START_AT:
    case SELECT_WORLD: {
      return {
        ...state,
        scene: "",
        type: "world",
        worldFocus: true
      };
    }
    case PAINT_COLLISION_TILE:
    case PAINT_COLLISION_LINE:
    case PAINT_COLLISION_FILL:
    case PAINT_COLOR_TILE:
    case PAINT_COLOR_LINE:
    case PAINT_COLOR_FILL: {
      return {
        ...state,
        type: "scenes",
        scene: action.sceneId,
        worldFocus: true
      };
    }
    case RELOAD_ASSETS:
    case EDIT_UI: {
      return {
        ...state,
        uiVersion: state.uiVersion + 1
      };
    }
    case RENAME_VARIABLE: {
      return {
        ...state,
        variableVersion: state.variableVersion + 1
      };
    }
    case EDIT_SEARCH_TERM:
      return {
        ...state,
        searchTerm: action.searchTerm
      };  
    case RESIZE_WORLD_VIEW:
      return {
        ...state,
        worldViewWidth: action.width,
        worldViewHeight: action.height
      }
    case SET_SELECTED_PALETTE:
      return {
        ...state,
        selectedPalette: action.paletteIndex
      }
    case SET_SELECTED_TILE_TYPE:
      return {
        ...state,
        selectedTileType: action.tileType
      }      
    case SET_SELECTED_BRUSH:
      return {
        ...state,
        selectedBrush: action.brush
      }  
    case SET_SHOW_LAYERS:
      return {
        ...state,
        showLayers: action.showLayers
      }    
    case SET_SCRIPT_TAB:
      return {
        ...state,
        lastScriptTab: action.tab
      }
    case SET_SCRIPT_TAB_SCENE:
      return {
        ...state,
        lastScriptTabScene: action.tab
      }
    case SET_SCRIPT_TAB_SECONDARY:
      return {
        ...state,
        lastScriptTabSecondary: action.tab
      }     
    case SET_PROFILING:
      return {
        ...state,
        profile: action.enabled
      }         
    default:
      return state;
  }
}
