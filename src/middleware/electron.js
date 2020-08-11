import { ipcRenderer, clipboard, remote } from "electron";
import settings from "electron-settings";
import uniq from "lodash/uniq";
import Path from "path";
import { statSync } from "fs-extra";
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
  REMOVE_CUSTOM_EVENT,
  EJECT_ENGINE,
  SET_TOOL
} from "../actions/actionTypes";
import confirmDeleteCustomEvent from "../lib/electron/dialog/confirmDeleteCustomEvent";
import confirmEjectEngineDialog from "../lib/electron/dialog/confirmEjectEngineDialog";
import confirmEnableColorDialog from "../lib/electron/dialog/confirmEnableColorDialog";
import {
  getScenes,
  getScenesLookup,
  getCustomEvents,
  getCustomEventsLookup,
  getActorsLookup,
  getTriggersLookup,
  getSettings
} from "../reducers/entitiesReducer";
import { walkEvents, filterEvents, getCustomEventIdsInEvents } from "../lib/helpers/eventSystem";
import { EVENT_CALL_CUSTOM_EVENT } from "../lib/compiler/eventTypes";
import { editScene, editActor, editTrigger, editProjectSettings } from "../actions";
import l10n from "../lib/helpers/l10n";
import ejectEngineToDir from "../lib/project/ejectEngineToDir";
import confirmEjectEngineReplaceDialog from "../lib/electron/dialog/confirmEjectEngineReplaceDialog";
import { TOOL_COLORS } from "../consts";

export default store => next => action => {
  if (action.type === OPEN_HELP) {
    ipcRenderer.send("open-help", action.page);
  } else if (action.type === OPEN_FOLDER) {
    remote.shell.openItem(action.path);
  } else if (action.type === PROJECT_LOAD_SUCCESS) {
    ipcRenderer.send("project-loaded", action.data.settings);
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
    const state = store.getState();
    const customEventsLookup = getCustomEventsLookup(state);
    const usedCustomEventIds = getCustomEventIdsInEvents([action.event]);
    const usedCustomEvents = usedCustomEventIds.map((id) => customEventsLookup[id]).filter((i) => i);
    clipboard.writeText(
      JSON.stringify(
        {
          ...action.event,
          __type: "event",
          __customEvents: usedCustomEvents.length > 0 ? usedCustomEvents : undefined
        },
        null,
        4
      )
    );
  } else if (action.type === COPY_SCRIPT) {
    const state = store.getState();
    const customEventsLookup = getCustomEventsLookup(state);
    const usedCustomEventIds = getCustomEventIdsInEvents(action.script);
    const usedCustomEvents = usedCustomEventIds.map((id) => customEventsLookup[id]).filter((i) => i);    
    clipboard.writeText(
      JSON.stringify(
        {
          script: action.script,
          __type: "script",
          __customEvents: usedCustomEvents.length > 0 ? usedCustomEvents : undefined
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
  } else if (action.type === EJECT_ENGINE) {
    const cancel = confirmEjectEngineDialog();

    if (cancel) {
      return;
    }

    const state = store.getState();
    const outputDir = Path.join(state.document.root, "assets", "engine");

    let ejectedEngineExists;
    try {
      statSync(outputDir);
      ejectedEngineExists = true;
    } catch (e) {
      ejectedEngineExists = false;
    }

    if (ejectedEngineExists) {
      const cancel2 = confirmEjectEngineReplaceDialog();
      if (cancel2) {
        return;
      }
    }

    ejectEngineToDir(outputDir).then(() => {
      remote.shell.openItem(outputDir);
    });

  } else if (action.type === SET_TOOL && action.tool === TOOL_COLORS) {
    const state = store.getState();
    const projectSettings = getSettings(state);
    if(!projectSettings.customColorsEnabled) {
      const cancel = confirmEnableColorDialog();
      if (cancel) {
        return;
      }
      store.dispatch(editProjectSettings({
        customColorsEnabled: true
      }));
    }
  }

  next(action);
};
