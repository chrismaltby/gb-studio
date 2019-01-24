import initialState from "./initialState";
import {
  SELECT_MAP,
  ADD_TRIGGER,
  SELECT_TRIGGER,
  ADD_ACTOR,
  SELECT_ACTOR,
  MOVE_MAP,
  SELECT_WORLD
} from "../actions/actionTypes";

export default function editor(state = initialState.editor, action) {
  switch (action.type) {
    case MOVE_MAP: {
      return {
        ...state,
        type: "maps",
        map: action.mapId
      };
    }
    case SELECT_MAP: {
      return {
        ...state,
        type: "maps",
        map: action.mapId
      };
    }
    case ADD_TRIGGER: {
      return {
        ...state,
        type: "triggers",
        map: action.mapId,
        index: 0
      };
    }
    case SELECT_TRIGGER: {
      return {
        ...state,
        type: "triggers",
        map: action.mapId,
        index: action.index
      };
    }
    case ADD_ACTOR: {
      return {
        ...state,
        type: "actors",
        map: action.mapId,
        index: 0
      };
    }
    case SELECT_ACTOR: {
      return {
        ...state,
        type: "actors",
        map: action.mapId,
        index: action.index
      };
    }
    case SELECT_WORLD: {
      return {
        ...state,
        type: "world"
      };
    }
    default:
      return state;
  }
}
