import initialState from "./initialState";
import { COPY_EVENT } from "../actions/actionTypes";

export default function console(state = initialState.clipboard, action) {
  switch (action.type) {
    case COPY_EVENT:
      return {
        ...state,
        event: action.event
      };
    default:
      return state;
  }
}
