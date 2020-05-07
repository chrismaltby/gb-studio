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
        output: [],
        warnings: []
      };
    case CMD_START:
      return {
        ...state,
        status: "running",
        output: [],
        warnings: []
      };
    case CMD_STD_OUT:
      if(!action.text) {
        return state;
      }
      return {
        ...state,
        output: [].concat(state.output, {
          type: "out",
          text: action.text
        })
      };
    case CMD_STD_ERR:
      if(!action.text) {
        return state;
      }      
      return {
        ...state,
        output: [].concat(state.output, {
          type: "err",
          text: action.text
        }),
        warnings: [].concat(state.warnings, {
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
