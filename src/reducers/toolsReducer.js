import initialState from "./initialState";
import {
  SET_TOOL,
  SELECT_ACTOR,
  SELECT_TRIGGER,
  SET_ACTOR_PREFAB,
  SET_TRIGGER_PREFAB,
  SET_SCENE_PREFAB
} from "../actions/actionTypes";

export default function tools(state = initialState.tools, action) {
  switch (action.type) {
    case SET_TOOL:
      return {
        ...state,
        prefab: null,
        selected: action.tool
      };
    case SET_ACTOR_PREFAB: {
      return {
        ...state,
        prefab: action.actor,
        selected: "actors"
      };
    }
    case SET_TRIGGER_PREFAB: {
      return {
        ...state,
        prefab: action.trigger,
        selected: "triggers"
      };
    }
    case SET_SCENE_PREFAB: {
      return {
        ...state,
        prefab: action.scene,
        selected: "scene"
      };
    }
    case SELECT_ACTOR:
    case SELECT_TRIGGER:
      return {
        ...state,
        selected: "select"
      };
    default:
      return state;
  }
}
