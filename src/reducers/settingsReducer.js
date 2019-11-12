import initialState from "./initialState";
import {
  SIDEBAR_WORLD_RESIZE,
  SIDEBAR_FILES_RESIZE
} from "../actions/actionTypes";

export default function settings(state = initialState.settings, action) {
  switch (action.type) {
    case SIDEBAR_WORLD_RESIZE:
      return {
        ...state,
        worldSidebarWidth: Math.min(
          window.innerWidth - 70,
          Math.max(300, action.width)
        )
      };
    case SIDEBAR_FILES_RESIZE: {
      return {
        ...state,
        filesSidebarWidth: Math.min(
          window.innerWidth - 70,
          Math.max(300, action.width)
        )
      };
    }
    default:
      return state;
  }
}
