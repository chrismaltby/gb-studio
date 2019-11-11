import { ipcRenderer, clipboard, remote } from "electron";
import settings from "electron-settings";
import { uniq } from "lodash";
import {
  OPEN_HELP,
  OPEN_FOLDER,
  PROJECT_LOAD_SUCCESS,
  COPY_ACTOR,
  COPY_TRIGGER,
  COPY_SCENE,
  COPY_EVENT,
  COPY_SCRIPT,
  SIDEBAR_WORLD_RESIZE,
  SIDEBAR_FILES_RESIZE,
  PROJECT_LOAD_FAILURE,
  REMOVE_CUSTOM_EVENT
} from "../actions/actionTypes";
import confirmDeleteCustomEvent from "../lib/electron/dialog/confirmDeleteCustomEvent";
import {
  getScenes,
  getScenesLookup,
  getCustomEvents,
  getActorsLookup,
  getTriggersLookup
} from "../reducers/entitiesReducer";
import { walkEvents, filterEvents } from "../lib/helpers/eventSystem";
import { EVENT_CALL_CUSTOM_EVENT } from "../lib/compiler/eventTypes";
import { editScene, editActor, editTrigger } from "../actions";
import l10n from "../lib/helpers/l10n";

export default store => next => action => {
  if (action.type === OPEN_HELP) {
    ipcRenderer.send("open-help", action.page);
  } else if (action.type === OPEN_FOLDER) {
    remote.shell.openItem(action.path);
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
  } else if (action.type === COPY_SCRIPT) {
    clipboard.writeText(
      JSON.stringify(
        {
          script: action.script,
          __type: "script"
        },
        null,
        4
      )
    );
  } else if (action.type === PROJECT_LOAD_FAILURE) {
    const window = remote.getCurrentWindow();
    window.close();
  } else if (action.type === REMOVE_CUSTOM_EVENT) {
    const state = store.getState();
    const customEvent =
      state.entities.present.entities.customEvents[action.customEventId];
    const customEventIndex = getCustomEvents(state).indexOf(customEvent);
    const customEventName =
      customEvent.name || `${l10n("CUSTOM_EVENT")} ${customEventIndex + 1}`;
    const scenes = getScenes(state);
    const scenesLookup = getScenesLookup(state);
    const actorsLookup = getActorsLookup(state);
    const triggersLookup = getTriggersLookup(state);
    const usedScenes = [];
    const usedActors = [];
    const usedTriggers = [];

    const isThisEvent = event =>
      event.command === EVENT_CALL_CUSTOM_EVENT &&
      event.args.customEventId === action.customEventId;

    const sceneName = sceneId => {
      const scene = scenesLookup[sceneId];
      const sceneIndex = scenes.indexOf(scene);
      return scene.name || `${l10n("SCENE")} ${sceneIndex + 1}`;
    };

    // Check for uses of this custom event in project
    scenes.forEach(scene => {
      walkEvents(scene.script, event => {
        if (isThisEvent(event)) {
          usedScenes.push([scene.id, event.id]);
        }
      });
      scene.actors.forEach(actorId => {
        walkEvents(actorsLookup[actorId].script, event => {
          if (isThisEvent(event)) {
            usedActors.push([scene.id, actorId, event.id]);
          }
        });
      });
      scene.triggers.forEach(triggerId => {
        walkEvents(triggersLookup[triggerId].script, event => {
          if (isThisEvent(event)) {
            usedTriggers.push([scene.id, triggerId, event.id]);
          }
        });
      });
    });

    const usedTotal =
      usedScenes.length + usedActors.length + usedTriggers.length;

    if (usedTotal > 0) {
      const sceneNames = uniq(
        []
          .concat([], usedScenes, usedActors, usedTriggers)
          .map(([sceneId]) => sceneName(sceneId))
      ).sort();

      // Display confirmation and stop delete if cancelled
      const cancel = confirmDeleteCustomEvent(
        customEventName,
        sceneNames,
        usedTotal
      );
      if (cancel) {
        return;
      }

      // Remove used instances in scenes
      usedScenes.forEach(([sceneId, eventId]) => {
        store.dispatch(
          editScene(sceneId, {
            script: filterEvents(scenesLookup[sceneId].script, eventId)
          })
        );
      });
      // Remove used instances in actors
      usedActors.forEach(([sceneId, actorId, eventId]) => {
        store.dispatch(
          editActor(sceneId, actorId, {
            script: filterEvents(actorsLookup[actorId].script, eventId)
          })
        );
      });
      // Remove used instances in triggers
      usedTriggers.forEach(([sceneId, triggerId, eventId]) => {
        store.dispatch(
          editTrigger(sceneId, triggerId, {
            script: filterEvents(triggersLookup[triggerId].script, eventId)
          })
        );
      });
    }
  }

  next(action);
};
