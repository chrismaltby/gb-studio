import { combineReducers } from "redux";
import tools from "./toolsReducer";
import world from "./worldReducer";
import project from "./projectReducer";
import modified from "./modifiedReducer";
import editor from "./editorReducer";
import navigation from "./navigationReducer";

const rootReducer = combineReducers({
  tools,
  modified,
  editor,
  // world,
  project,
  navigation
});

export default rootReducer;
