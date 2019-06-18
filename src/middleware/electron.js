import { ipcRenderer, clipboard } from "electron";
import settings from "electron-settings";
import open from "open";
import {
  OPEN_HELP,
  OPEN_FOLDER,
  PROJECT_LOAD_SUCCESS,
  COPY_ACTOR,
  COPY_TRIGGER,
  COPY_SCENE,
  COPY_EVENT,
  SIDEBAR_WORLD_RESIZE,
  SIDEBAR_FILES_RESIZE
} from "../actions/actionTypes";

export default store => next => action => {
  if (action.type === OPEN_HELP) {
    ipcRenderer.send("open-help", action.page);
  } else if (action.type === OPEN_FOLDER) {
    open(action.path);
  } else if (action.type === PROJECT_LOAD_SUCCESS) {
    ipcRenderer.send("project-loaded", action.data);
  } else if (action.type === SIDEBAR_WORLD_RESIZE) {
    settings.set("worldSidebarWidth", action.width);
  } else if (action.type === SIDEBAR_FILES_RESIZE) {
    settings.set("filesSidebarWidth", action.width);
  } else if (action.type === COPY_ACTOR) {
    clipboard.writeText(
      JSON.stringify(
        {
          ...action.actor,
          __type: "actor"
        },
        null,
        4
      )
    );
  } else if (action.type === COPY_TRIGGER) {
    clipboard.writeText(
      JSON.stringify(
        {
          ...action.trigger,
          __type: "trigger"
        },
        null,
        4
      )
    );
  } else if (action.type === COPY_SCENE) {
    const state = store.getState();
    const { scene } = action;
    const { actors, triggers } = state.entities.present.entities;
    clipboard.writeText(
      JSON.stringify(
        {
          ...scene,
          actors: scene.actors.map(actorId => actors[actorId]),
          triggers: scene.triggers.map(triggerId => triggers[triggerId]),
          __type: "scene"
        },
        null,
        4
      )
    );
  } else if (action.type === COPY_EVENT) {
    clipboard.writeText(
      JSON.stringify(
        {
          ...action.event,
          __type: "event"
        },
        null,
        4
      )
    );
  }

  return next(action);
};
