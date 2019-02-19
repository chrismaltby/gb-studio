import { combineReducers } from "redux";
import undoable, { distinctState } from 'redux-undo';
import tools from "./toolsReducer";
import project from "./projectReducer";
import editor from "./editorReducer";
import navigation from "./navigationReducer";
import document from "./documentReducer";
import console from "./consoleReducer";

const rootReducer = combineReducers({
  tools,
  editor,
  project: undoable(project, { limit: 5, filter: distinctState() }),
  document,
  navigation,
  console
});

export default rootReducer;
