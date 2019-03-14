import initialState from "./initialState";
import {
  PROJECT_LOAD_SUCCESS,
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
  SELECT_WORLD,
  ZOOM_IN,
  ZOOM_OUT,
  ZOOM_RESET,
  REMOVE_SCENE,
  REMOVE_ACTOR,
  REMOVE_ACTOR_AT,
  REMOVE_TRIGGER,
  REMOVE_TRIGGER_AT
} from "../actions/actionTypes";

export default function editor(state = initialState.editor, action) {
  switch (action.type) {
    case PROJECT_LOAD_SUCCESS: {
      return Object.assign(
        {},
        state,
        action.data.settings &&
          action.data.settings.zoom && {
            zoom: action.data.settings.zoom
          }
      );
    }
    case MOVE_SCENE: {
      return {
        ...state,
        type: "scenes",
        scene: action.sceneId
      };
    }
    case SELECT_SCENE: {
      return {
        ...state,
        type: "scenes",
        scene: action.sceneId
      };
    }
    case ADD_SCENE: {
      return {
        ...state,
        type: "scenes",
        scene: action.id
      };
    }
    case ADD_TRIGGER: {
      return {
        ...state,
        type: "triggers",
        scene: action.sceneId,
        index: 0
      };
    }
    case SELECT_TRIGGER: {
      return {
        ...state,
        type: "triggers",
        scene: action.sceneId,
        index: action.index
      };
    }
    case ADD_ACTOR: {
      return {
        ...state,
        type: "actors",
        scene: action.sceneId,
        index: 0
      };
    }
    case SELECT_ACTOR: {
      return {
        ...state,
        type: "actors",
        scene: action.sceneId,
        index: action.index
      };
    }
    case SELECT_SCRIPT_EVENT: {
      return {
        ...state,
        eventId: action.eventId
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
    case REMOVE_SCENE:
    case REMOVE_ACTOR:
    case REMOVE_TRIGGER:
    case REMOVE_ACTOR_AT:
    case REMOVE_TRIGGER_AT:
    case SELECT_WORLD: {
      return {
        ...state,
        scene: "",
        type: "world"
      };
    }
    case ZOOM_IN:
      return Object.assign(
        {
          ...state
        },
        action.section === "world" && {
          zoom: Math.min(800, state.zoom * 2)
        },
        action.section === "sprites" && {
          zoomSprite: Math.min(800, state.zoomSprite * 2)
        },
        action.section === "backgrounds" && {
          zoomImage: Math.min(800, state.zoomImage * 2)
        },
        action.section === "ui" && {
          zoomUI: Math.min(800, state.zoomUI * 2)
        }
      );
    case ZOOM_OUT:
      return Object.assign(
        {
          ...state
        },
        action.section === "world" && {
          zoom: Math.max(25, state.zoom / 2)
        },
        action.section === "sprites" && {
          zoomSprite: Math.max(25, state.zoomSprite / 2)
        },
        action.section === "backgrounds" && {
          zoomImage: Math.max(25, state.zoomImage / 2)
        },
        action.section === "ui" && {
          zoomUI: Math.max(25, state.zoomUI / 2)
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
