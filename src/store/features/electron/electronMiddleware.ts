import { ipcRenderer, remote } from "electron";
import settings from "electron-settings";
import uniq from "lodash/uniq";
import Path from "path";
import { statSync } from "fs-extra";
import confirmDeleteCustomEvent from "../../../lib/electron/dialog/confirmDeleteCustomEvent";
import confirmReplaceCustomEvent from "../../../lib/electron/dialog/confirmReplaceCustomEvent";
import confirmEjectEngineDialog from "../../../lib/electron/dialog/confirmEjectEngineDialog";
import confirmEnableColorDialog from "../../../lib/electron/dialog/confirmEnableColorDialog";
import {
  walkEvents,
  walkSceneSpecificEvents,
  walkActorEvents,
  filterEvents,
  getCustomEventIdsInEvents,
  getCustomEventIdsInActor,
  getCustomEventIdsInScene,
} from "../../../lib/helpers/eventSystem";
import { EVENT_CALL_CUSTOM_EVENT } from "../../../lib/compiler/eventTypes";
import { editTrigger } from "../../../actions";
import l10n from "../../../lib/helpers/l10n";
import ejectEngineToDir from "../../../lib/project/ejectEngineToDir";
import confirmEjectEngineReplaceDialog from "../../../lib/electron/dialog/confirmEjectEngineReplaceDialog";
import { actions as editorActions } from "../../../store/features/editor/editorSlice";
import {
  getSettings,
  actions as settingsActions,
} from "../../../store/features/settings/settingsSlice";
import { Middleware, createAction } from "@reduxjs/toolkit";
import { RootState } from "../../configureStore";
import { actions as projectActions } from "../project/projectActions";

const openHelp = createAction<string>("electron/openHelp");
const openFolder = createAction<string>("electron/openFolder");

const electronMiddleware: Middleware<{}, RootState> = (store) => (next) => (
  action
) => {
  if (openHelp.match(action)) {
    ipcRenderer.send("open-help", action.payload);
  } else if (openFolder.match(action)) {
    remote.shell.openItem(action.payload);
  } else if (editorActions.resizeWorldSidebar.match(action)) {
    settings.set("worldSidebarWidth", action.payload);
  } else if (editorActions.resizeFilesSidebar.match(action)) {
    settings.set("filesSidebarWidth", action.payload);
  } else if (
    editorActions.setTool.match(action) &&
    action.payload.tool === "colors"
  ) {
    const state = store.getState();
    const projectSettings = getSettings(state);
    if (!projectSettings.customColorsEnabled) {
      const cancel = confirmEnableColorDialog();
      if (cancel) {
        return;
      }
      store.dispatch(
        settingsActions.editSettings({
          customColorsEnabled: true,
        })
      );
    }
  } else if (projectActions.loadProject.fulfilled.match(action)) {
    ipcRenderer.send("project-loaded", action.payload.data.settings);
  } else if (projectActions.loadProject.rejected.match(action)) {
    const window = remote.getCurrentWindow();
    window.close();
  }




  /*
  if (action.type === REMOVE_CUSTOM_EVENT) {
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

  } 
*/
  next(action);
};

export const actions = {
  openHelp,
  openFolder,
};

export default electronMiddleware;
