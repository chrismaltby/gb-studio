import path from "path";
import initialState from "./initialState";
import {
  PROJECT_LOAD_SUCCESS,
  PROJECT_SAVE_SUCCESS,
  ADD_SCENE,
  MOVE_SCENE,
  EDIT_SCENE,
  REMOVE_SCENE,
  ADD_ACTOR,
  MOVE_ACTOR,
  EDIT_ACTOR,
  REMOVE_ACTOR,
  REMOVE_ACTOR_AT,
  ADD_COLLISION_TILE,
  REMOVE_COLLISION_TILE,
  ADD_TRIGGER,
  RESIZE_TRIGGER,
  MOVE_TRIGGER,
  REMOVE_TRIGGER,
  REMOVE_TRIGGER_AT,
  EDIT_TRIGGER,
  RENAME_VARIABLE,
  EDIT_WORLD,
  EDIT_PROJECT,
  EDIT_PROJECT_SETTINGS
} from "../actions/actionTypes";

export default function modified(state = initialState.document, action) {
  switch (action.type) {
    case PROJECT_LOAD_SUCCESS:
      return {
        ...state,
        path: action.path,
        root: path.dirname(action.path),
        modified: false
      };
    case PROJECT_SAVE_SUCCESS:
      return {
        ...state,
        modified: false
      };
    case MOVE_SCENE:
    case EDIT_SCENE:
    case REMOVE_SCENE:
    case ADD_ACTOR:
    case ADD_SCENE:
    case MOVE_ACTOR:
    case EDIT_ACTOR:
    case REMOVE_ACTOR:
    case REMOVE_ACTOR_AT:
    case ADD_COLLISION_TILE:
    case REMOVE_COLLISION_TILE:
    case ADD_TRIGGER:
    case RESIZE_TRIGGER:
    case MOVE_TRIGGER:
    case REMOVE_TRIGGER:
    case REMOVE_TRIGGER_AT:
    case EDIT_TRIGGER:
    case RENAME_VARIABLE:
    case EDIT_WORLD:
    case EDIT_PROJECT:
    case EDIT_PROJECT_SETTINGS:
      return {
        ...state,
        modified: true
      };
    default:
      return state;
  }
}
