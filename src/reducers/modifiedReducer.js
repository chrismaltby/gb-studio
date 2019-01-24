import {
  WORLD_LOAD_SUCCESS,
  WORLD_SAVE_SUCCESS,
  ADD_MAP,
  MOVE_MAP,
  EDIT_MAP,
  REMOVE_MAP,
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
  RENAME_FLAG,
  EDIT_WORLD
} from "../actions/actionTypes";

export default function modified(state = false, action) {
  switch (action.type) {
    case WORLD_LOAD_SUCCESS:
    case WORLD_SAVE_SUCCESS:
      return false;
    case MOVE_MAP:
    case EDIT_MAP:
    case REMOVE_MAP:
    case ADD_ACTOR:
    case ADD_MAP:
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
    case RENAME_FLAG:
    case EDIT_WORLD:
      return true;
    default:
      return state;
  }
}
