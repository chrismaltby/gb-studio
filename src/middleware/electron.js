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
  SET_TOOL,
  PASTE_CUSTOM_EVENTS
} from "../actions/actionTypes";
import confirmDeleteCustomEvent from "../lib/electron/dialog/confirmDeleteCustomEvent";
import confirmReplaceCustomEvent from "../lib/electron/dialog/confirmReplaceCustomEvent";
import confirmEjectEngineDialog from "../lib/electron/dialog/confirmEjectEngineDialog";
import confirmEnableColorDialog from "../lib/electron/dialog/confirmEnableColorDialog";
import {
  getScenes,
  getScenesLookup,
  getCustomEvents,
  getCustomEventsLookup,
  getActorsLookup,
  getTriggersLookup,
} from "../reducers/entitiesReducer";
import { walkEvents, walkSceneSpecificEvents, walkActorEvents, filterEvents, getCustomEventIdsInEvents, getCustomEventIdsInActor, getCustomEventIdsInScene } from "../lib/helpers/eventSystem";
import { EVENT_CALL_CUSTOM_EVENT } from "../lib/compiler/eventTypes";
import { editScene, editActor, editTrigger, editProjectSettings, editCustomEvent } from "../actions";
import l10n from "../lib/helpers/l10n";
import ejectEngineToDir from "../lib/project/ejectEngineToDir";
import confirmEjectEngineReplaceDialog from "../lib/electron/dialog/confirmEjectEngineReplaceDialog";
import { TOOL_COLORS } from "../consts";
import { actions as editorActions } from "../store/features/editor/editorSlice";
import { getSettings } from "../store/features/settings/settingsSlice";

export default store => next => action => {
  if (action.type === OPEN_HELP) {
    ipcRenderer.send("open-help", action.page);
  } else if (action.type === OPEN_FOLDER) {
    remote.shell.openItem(action.path);
  } else if (action.type === PROJECT_LOAD_SUCCESS) {
    ipcRenderer.send("project-loaded", action.data.settings);
  } else if (editorActions.resizeWorldSidebar.match(action)) {
    settings.set("worldSidebarWidth", action.payload);
  } else if (editorActions.resizeFilesSidebar.match(action)) {
    settings.set("filesSidebarWidth", action.payload);
  } else if (action.type === COPY_ACTOR) {
    const state = store.getState();
    const customEventsLookup = getCustomEventsLookup(state);
    const usedCustomEventIds = uniq(getCustomEventIdsInActor(action.actor));
    const usedCustomEvents = usedCustomEventIds.map((id) => customEventsLookup[id]).filter((i) => i);
    clipboard.writeText(
      JSON.stringify(
        {
          actor: action.actor,
          __type: "actor",
          __customEvents: usedCustomEvents.length > 0 ? usedCustomEvents : undefined
        },
        null,
        4
      )
    );
  } else if (action.type === COPY_TRIGGER) {
    const state = store.getState();
    const customEventsLookup = getCustomEventsLookup(state);
    const usedCustomEventIds = uniq(getCustomEventIdsInEvents(action.trigger.script));
    const usedCustomEvents = usedCustomEventIds.map((id) => customEventsLookup[id]).filter((i) => i);
    clipboard.writeText(
      JSON.stringify(
        {
          trigger: action.trigger,
          __type: "trigger",
          __customEvents: usedCustomEvents.length > 0 ? usedCustomEvents : undefined
        },
        null,
        4
      )
    );
  } else if (action.type === COPY_SCENE) {
    const state = store.getState();
    const { actors, triggers } = state.entities.present.entities;

    const scene = {
      ...action.scene,
      actors: action.scene.actors.map(actorId => actors[actorId]),
      triggers: action.scene.triggers.map(triggerId => triggers[triggerId]),  
    }

    const customEventsLookup = getCustomEventsLookup(state);
    const usedCustomEventIds = uniq(getCustomEventIdsInScene(scene));
    const usedCustomEvents = usedCustomEventIds.map((id) => customEventsLookup[id]).filter((i) => i);

    clipboard.writeText(
      JSON.stringify(
        {
          scene,
          __type: "scene",
          __customEvents: usedCustomEvents.length > 0 ? usedCustomEvents : undefined
        },
        null,
        4
      )
    );
  } else if (action.type === COPY_EVENT) {
    const state = store.getState();
    const customEventsLookup = getCustomEventsLookup(state);
    const usedCustomEventIds = uniq(getCustomEventIdsInEvents([action.event]));
    const usedCustomEvents = usedCustomEventIds.map((id) => customEventsLookup[id]).filter((i) => i);
    clipboard.writeText(
      JSON.stringify(
        {
          event: action.event,
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
    const usedCustomEventIds = uniq(getCustomEventIdsInEvents(action.script));
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
    const usedScenes = {};
    const usedActors = {};
    const usedTriggers = {};
    const usedSceneIds = [];

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
      walkSceneSpecificEvents(scene, event => {
        if (isThisEvent(event)) {
          if (!usedScenes[scene.id]) {
            usedScenes[scene.id] = {
              sceneId: scene.id,
              eventIds: []
            };
          }
          usedScenes[scene.id].eventIds.push(event.id);
          usedSceneIds.push(scene.id);
        }
      });
      scene.actors.forEach(actorId => {
        walkActorEvents(actorsLookup[actorId], event => {
          if (isThisEvent(event)) {
            if (!usedActors[actorId]) {
              usedActors[actorId] = {
                sceneId: scene.id,
                eventIds: []
              };
            }            
            usedActors[actorId].eventIds.push(event.id);
            usedSceneIds.push(scene.id);
          }
        });
      });
      scene.triggers.forEach(triggerId => {
        walkEvents(triggersLookup[triggerId].script, event => {
          if (isThisEvent(event)) {
            if (!usedTriggers[triggerId]) {
              usedTriggers[triggerId] = {
                sceneId: scene.id,
                eventIds: []
              };
            }              
            usedTriggers[triggerId].eventIds.push(event.id);
            usedSceneIds.push(scene.id);
          }
        });
      });
    });

    const usedTotal = usedSceneIds.length;

    if (usedTotal > 0) {
      const sceneNames = uniq(
        usedSceneIds.map((sceneId) => sceneName(sceneId))
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
      Object.keys(usedScenes).forEach((sceneId) => {
        const eventIds = usedScenes[sceneId].eventIds;
        
        const filter = (event) => !eventIds.includes(event.id)

        store.dispatch(
          editScene(sceneId, {
            script: filterEvents(scenesLookup[sceneId].script || [], filter),
            playerHit1Script: filterEvents(scenesLookup[sceneId].playerHit1Script || [], filter),
            playerHit2Script: filterEvents(scenesLookup[sceneId].playerHit2Script || [], filter),
            playerHit3Script: filterEvents(scenesLookup[sceneId].playerHit3Script || [], filter),
          })
        );
      });
      // Remove used instances in actors
      Object.keys(usedActors).forEach((actorId) => {
        const eventIds = usedActors[actorId].eventIds;
        const sceneId = usedActors[actorId].sceneId;

        const filter = (event) => !eventIds.includes(event.id)

        store.dispatch(
          editActor(sceneId, actorId, {
            script: filterEvents(actorsLookup[actorId].script || [], filter),
            startScript: filterEvents(actorsLookup[actorId].startScript || [], filter),
            updateScript: filterEvents(actorsLookup[actorId].updateScript || [], filter),
            hit1Script: filterEvents(actorsLookup[actorId].hit1Script || [], filter),
            hit2Script: filterEvents(actorsLookup[actorId].hit2Script || [], filter),
            hit3Script: filterEvents(actorsLookup[actorId].hit3Script || [], filter),
          })
        );
      });
      // Remove used instances in triggers
      Object.keys(usedTriggers).forEach((triggerId) => {
        const eventIds = usedTriggers[triggerId].eventIds;
        const sceneId = usedTriggers[triggerId].sceneId;

        const filter = (event) => !eventIds.includes(event.id)

        store.dispatch(
          editTrigger(sceneId, triggerId, {
            script: filterEvents(triggersLookup[triggerId].script || [], filter)
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

  } else if (action.type === PASTE_CUSTOM_EVENTS) {

    try {
      const clipboardData = JSON.parse(clipboard.readText());
      if (clipboardData.__customEvents) {
        const state = store.getState();

        clipboardData.__customEvents.forEach((customEvent) => {
          const customEventsLookup = getCustomEventsLookup(state);
          const existingCustomEvent = customEventsLookup[customEvent.id];

          if (existingCustomEvent) {
            if (JSON.stringify(customEvent) === JSON.stringify(existingCustomEvent)) {
              // Already have this custom event
              return;
            }

            // Display confirmation and stop replace if cancelled
            const cancel = confirmReplaceCustomEvent(
              existingCustomEvent.name,
            );
            if (cancel) {
              return;
            }
          }

          store.dispatch(editCustomEvent(customEvent.id, customEvent))
        });
      }
    } catch (err) {
      // Ignore
    }

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
