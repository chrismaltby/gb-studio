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
  DRAG_ACTOR_START,
  DRAG_ACTOR_STOP,
  DRAG_TRIGGER_START,
  DRAG_TRIGGER_STOP,
  SCENE_HOVER,
  ACTOR_HOVER,
  SELECT_WORLD,
  ZOOM_IN,
  ZOOM_OUT,
  ZOOM_RESET,
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
  ADD_COLLISION_TILE,
  REMOVE_COLLISION_TILE,
  SELECT_CUSTOM_EVENT,
  ADD_CUSTOM_EVENT,
  REMOVE_CUSTOM_EVENT,
  RELOAD_ASSETS,
  RENAME_VARIABLE
} from "../actions/actionTypes";
import { zoomIn, zoomOut } from "../lib/helpers/zoom";

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
    case DRAG_ACTOR_START: {
      return {
        ...state,
        type: "actors",
        actorDragging: true,
        dragging: DRAG_ACTOR,
        entityId: action.id,
        scene: action.sceneId,
        worldFocus: true
      };
    }
    case DRAG_ACTOR_STOP: {
      return {
        ...state,
        actorDragging: null,
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
    case ADD_COLLISION_TILE:
    case REMOVE_COLLISION_TILE: {
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
    case ZOOM_IN:
      return Object.assign(
        {
          ...state
        },
        action.section === "world" && {
          zoom: Math.min(
            800,
            action.delta !== undefined
              ? state.zoom + -action.delta
              : zoomIn(state.zoom)
          )
        },
        action.section === "sprites" && {
          zoomSprite: Math.min(
            800,
            action.delta !== undefined
              ? state.zoomSprite + -action.delta
              : zoomIn(state.zoomSprite)
          )
        },
        action.section === "backgrounds" && {
          zoomImage: Math.min(
            800,
            action.delta !== undefined
              ? state.zoomImage + -action.delta
              : zoomIn(state.zoomImage)
          )
        },
        action.section === "ui" && {
          zoomUI: Math.min(
            800,
            action.delta !== undefined
              ? state.zoomUI + -action.delta
              : zoomIn(state.zoomUI)
          )
        }
      );
    case ZOOM_OUT:
      return Object.assign(
        {
          ...state
        },
        action.section === "world" && {
          zoom: Math.max(
            25,
            action.delta !== undefined
              ? state.zoom - action.delta
              : zoomOut(state.zoom)
          )
        },
        action.section === "sprites" && {
          zoomSprite: Math.max(
            25,
            action.delta !== undefined
              ? state.zoomSprite - action.delta
              : zoomOut(state.zoomSprite)
          )
        },
        action.section === "backgrounds" && {
          zoomImage: Math.max(
            25,
            action.delta !== undefined
              ? state.zoomImage - action.delta
              : zoomOut(state.zoomImage)
          )
        },
        action.section === "ui" && {
          zoomUI: Math.max(
            25,
            action.delta !== undefined
              ? state.zoomUI - action.delta
              : zoomOut(state.zoomUI)
          )
        }
      );
    case ZOOM_RESET:
      return Object.assign(
        {
          ...state
        },
        action.section === "world" && {
          zoom: 100
        },
        action.section === "sprites" && {
          zoomSprite: 100
        },
        action.section === "backgrounds" && {
          zoomImage: 100
        },
        action.section === "ui" && {
          zoomUI: 100
        }
      );
    default:
      return state;
  }
}
