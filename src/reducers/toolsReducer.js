import initialState from "./initialState";
import { SET_TOOL, SELECT_TRIGGER } from "../actions/actionTypes";

export default function tools(state = initialState.tools, action) {
  switch (action.type) {
    case SET_TOOL:
      return {
        ...state,
        selected: action.tool
      };
    case SELECT_TRIGGER:
      return {
        ...state,
        selected: "select"
      };
    default:
      return state;
  }
}
