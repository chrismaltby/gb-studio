import path from "path";
import initialState from "./initialState";
import {
  PROJECT_LOAD_REQUEST,
  PROJECT_LOAD_SUCCESS,
  PROJECT_SAVE_REQUEST,
  PROJECT_SAVE_SUCCESS,
  PROJECT_SAVE_FAILURE,
  PROJECT_SAVE_AS_REQUEST,
  PROJECT_SAVE_AS_SUCCESS,
  PROJECT_SAVE_AS_FAILURE,
} from "../actions/actionTypes";

export default function modified(state = initialState.document, action) {
  switch (action.type) {
    case PROJECT_LOAD_REQUEST:
      return {
        ...state,
        loaded: false
      };
    case PROJECT_LOAD_SUCCESS:
      return {
        ...state,
        path: action.path,
        root: path.dirname(action.path),
        modified: false,
        loaded: true
      };
    case PROJECT_SAVE_REQUEST:
      return {
        ...state,
        saving: true
      };
    case PROJECT_SAVE_SUCCESS:
      return {
        ...state,
        modified: false,
        saving: false
      };
    case PROJECT_SAVE_FAILURE:
      return {
        ...state,
        saving: false
      };
    case PROJECT_SAVE_AS_REQUEST:
      return {
        ...state,
        saving: true
      };
    case PROJECT_SAVE_AS_SUCCESS:
      return {
        ...state,
        path: action.path,
        root: path.dirname(action.path),
        modified: false,
        saving: false
      };
    case PROJECT_SAVE_AS_FAILURE:
      return {
        ...state,
        saving: false
      };
    default:
      return state;
  }
}
