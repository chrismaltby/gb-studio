import initialState from "./initialState";
import {
  SELECT_SCRIPT_EVENT,
  REMOVE_SCENE,
  REMOVE_ACTOR,
  REMOVE_ACTOR_AT,
  MOVE_ACTOR,
  REMOVE_TRIGGER,
  REMOVE_TRIGGER_AT,
  MOVE_TRIGGER,
  EDIT_PLAYER_START_AT,
  EDIT_UI,
  SELECT_CUSTOM_EVENT,
  REMOVE_CUSTOM_EVENT,
  RELOAD_ASSETS,
} from "../actions/actionTypes";

export const DRAG_PLAYER = "DRAG_PLAYER";
export const DRAG_DESTINATION = "DRAG_DESTINATION";
export const DRAG_ACTOR = "DRAG_ACTOR";
export const DRAG_TRIGGER = "DRAG_TRIGGER";

export default function editor(state = initialState.editor, action) {
  switch (action.type) {
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
    case EDIT_PLAYER_START_AT: {
      return {
        ...state,
        scene: "",
        type: "world",
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
    default:
      return state;
  }
}
