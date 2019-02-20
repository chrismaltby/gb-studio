import { combineReducers } from "redux";
import undoable, { distinctState } from 'redux-undo';
import tools from "./toolsReducer";
import project from "./projectReducer";
import editor from "./editorReducer";
import navigation from "./navigationReducer";
import document from "./documentReducer";
import console from "./consoleReducer";
import { PROJECT_LOAD_SUCCESS, PROJECT_SAVE_SUCCESS } from "../actions/actionTypes";

const rootReducer = combineReducers({
  tools,
  editor,
  project: undoable(project, {
    limit: 50, filter: distinctState(),
    initTypes: [
      '@@redux/INIT',
      '@@INIT',
      PROJECT_LOAD_SUCCESS,
      PROJECT_SAVE_SUCCESS
    ]
  }),
  document,
  navigation,
  console
});

export default rootReducer;
