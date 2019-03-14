import initialState from "./initialState";
import {
  PLAY_MUSIC,
  PAUSE_MUSIC,
  SET_SECTION,
  SET_NAVIGATION_ID
} from "../actions/actionTypes";

export default function music(state = initialState.music, action) {
  switch (action.type) {
    case PLAY_MUSIC:
      return {
        ...state,
        playing: true
      };
    case PAUSE_MUSIC:
    case SET_SECTION:
    case SET_NAVIGATION_ID:
      return {
        ...state,
        playing: false
      };
    default:
      return state;
  }
}
