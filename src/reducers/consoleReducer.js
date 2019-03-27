import initialState from "./initialState";
import {
  CMD_CLEAR,
  CMD_START,
  CMD_STD_OUT,
  CMD_STD_ERR,
  CMD_COMPLETE
} from "../actions/actionTypes";

export default function console(state = initialState.console, action) {
  switch (action.type) {
    case CMD_CLEAR:
      return {
        ...state,
        output: []
      };
    case CMD_START:
      return {
        ...state,
        status: "running",
        output: []
      };
    case CMD_STD_OUT:
      return {
        ...state,
        output: [].concat(state.output.slice(-2000), {
          type: "out",
          text: action.text
        })
      };
    case CMD_STD_ERR:
      return {
        ...state,
        output: [].concat(state.output.slice(-2000), {
          type: "err",
          text: action.text
        })
      };
    case CMD_COMPLETE:
      return {
        ...state,
        status: "complete"
      };
    default:
      return state;
  }
}
