import initialState from "./initialState";
import {
  SELECT_SCENE,
  ADD_TRIGGER,
  SELECT_TRIGGER,
  ADD_ACTOR,
  SELECT_ACTOR,
  ADD_SCENE,
  MOVE_SCENE,
  SELECT_WORLD
} from "../actions/actionTypes";

export default function editor(state = initialState.editor, action) {
  switch (action.type) {
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
