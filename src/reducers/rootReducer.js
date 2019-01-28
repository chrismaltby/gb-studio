import { combineReducers } from "redux";
import tools from "./toolsReducer";
import world from "./worldReducer";
import project from "./projectReducer";
import modified from "./modifiedReducer";
import editor from "./editorReducer";
import navigation from "./navigationReducer";
import document from "./documentReducer";
import console from "./consoleReducer";

const rootReducer = combineReducers({
  tools,
  modified,
  editor,
  // world,
  project,
  document,
  navigation,
  console
});

export default rootReducer;
