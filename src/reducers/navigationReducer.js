import initialState from "./initialState";
import {
  SET_SECTION,
  SET_NAVIGATION_ID,
  SELECT_ACTOR,
  SELECT_TRIGGER,
  ADD_ACTOR,
  ADD_TRIGGER,
  SET_STATUS
} from "../actions/actionTypes";

export default function tools(state = initialState.navigation, action) {
  switch (action.type) {
    case SET_SECTION:
      return {
        ...state,
        section: action.section,
        id: ""
      };
    case SET_NAVIGATION_ID:
      return {
        ...state,
        id: action.id
      };
    case ADD_ACTOR:
    case ADD_TRIGGER:
    case SELECT_ACTOR:
    case SELECT_TRIGGER:
      return {
        ...state,
        mapId: action.mapId
      };
    case SET_STATUS:
      return {
        ...state,
        status: action.status
      };
    default:
      return state;
  }
}
