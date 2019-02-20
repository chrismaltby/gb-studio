import initialState from "./initialState";
import {
  SELECT_SCENE,
  ADD_TRIGGER,
  SELECT_TRIGGER,
  ADD_ACTOR,
  SELECT_ACTOR,
  ADD_SCENE,
  MOVE_SCENE,
  DRAG_SCENE,
  DRAG_SCENE_START,
  DRAG_SCENE_STOP,
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
    case DRAG_SCENE_START: {
      return {
        ...state,
        sceneDragging: true,
        sceneDragX: 0,
        sceneDragY: 0
      }
    }
    case DRAG_SCENE_STOP: {
      return {
        ...state,
        sceneDragging: false,
        sceneDragX: 0,
        sceneDragY: 0
      }
    }
    case DRAG_SCENE: {
      return {
        ...state,
        sceneDragX: action.moveX,
        sceneDragY: action.moveY
      }
    }
    case SELECT_WORLD: {
      return {
        ...state,
        scene: "",
        type: "world"
      };
    }
    default:
      return state;
  }
}
