import { ipcRenderer, remote } from "electron";
import settings from "electron-settings";
import uniq from "lodash/uniq";
import Path from "path";
import { statSync } from "fs-extra";
import confirmDeleteCustomEvent from "../../../lib/electron/dialog/confirmDeleteCustomEvent";
import confirmReplaceCustomEvent from "../../../lib/electron/dialog/confirmReplaceCustomEvent";
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
import l10n from "../../../lib/helpers/l10n";
import { actions as editorActions } from "../../../store/features/editor/editorSlice";
import {
  getSettings,
  actions as settingsActions,
} from "../../../store/features/settings/settingsSlice";
import { Middleware, createAction } from "@reduxjs/toolkit";
import { RootState } from "../../configureStore";
import { actions as projectActions } from "../project/projectActions";
import {
  actions as entityActions,
  customEventSelectors,
  sceneSelectors,
  actorSelectors,
  triggerSelectors,
  ScriptEvent,
} from "../entities/entitiesSlice";
import { Dictionary } from "lodash";

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
  } else if (entityActions.removeCustomEvent.match(action)) {
    const state = store.getState();
    const customEvent = customEventSelectors.selectById(
      state,
      action.payload.customEventId
    );

    if (!customEvent) {
      return;
    }

    const allCustomEvents = customEventSelectors.selectAll(state);
    const customEventIndex = allCustomEvents.indexOf(customEvent);
    const customEventName =
      customEvent.name || `${l10n("CUSTOM_EVENT")} ${customEventIndex + 1}`;
    const scenes = sceneSelectors.selectAll(state);
    const scenesLookup = sceneSelectors.selectEntities(state);
    const actorsLookup = actorSelectors.selectEntities(state);
    const triggersLookup = triggerSelectors.selectEntities(state);
    const usedScenes = {} as Dictionary<{
      sceneId: string;
      eventIds: string[];
    }>;
    const usedActors = {} as Dictionary<{
      sceneId: string;
      eventIds: string[];
    }>;
    const usedTriggers = {} as Dictionary<{
      sceneId: string;
      eventIds: string[];
    }>;
    const usedSceneIds = [] as string[];

    const isThisEvent = (event: ScriptEvent) =>
      event.command === EVENT_CALL_CUSTOM_EVENT &&
      event.args.customEventId === action.payload.customEventId;

    const sceneName = (sceneId: string) => {
      const scene = scenesLookup[sceneId];
      const sceneIndex = scene ? scenes.indexOf(scene) : 0;
      return scene?.name || `${l10n("SCENE")} ${sceneIndex + 1}`;
    };

    // Check for uses of this custom event in project
    scenes.forEach((scene) => {
      walkSceneSpecificEvents(scene, (event: ScriptEvent) => {
        if (isThisEvent(event)) {
          if (!usedScenes[scene.id]) {
            usedScenes[scene.id] = {
              sceneId: scene.id,
              eventIds: [],
            };
          }
          usedScenes[scene.id].eventIds.push(event.id);
          usedSceneIds.push(scene.id);
        }
      });
      scene.actors.forEach((actorId) => {
        walkActorEvents(actorsLookup[actorId], (event: ScriptEvent) => {
          if (isThisEvent(event)) {
            if (!usedActors[actorId]) {
              usedActors[actorId] = {
                sceneId: scene.id,
                eventIds: [],
              };
            }
            usedActors[actorId].eventIds.push(event.id);
            usedSceneIds.push(scene.id);
          }
        });
      });
      scene.triggers.forEach((triggerId) => {
        const trigger = triggersLookup[triggerId];
        trigger &&
          walkEvents(trigger.script, (event: ScriptEvent) => {
            if (isThisEvent(event)) {
              if (!usedTriggers[triggerId]) {
                usedTriggers[triggerId] = {
                  sceneId: scene.id,
                  eventIds: [],
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

        const filter = (event: ScriptEvent) => !eventIds.includes(event.id);

        store.dispatch(
          entityActions.editScene({
            sceneId,
            changes: {
              script: filterEvents(scenesLookup[sceneId]?.script || [], filter),
              playerHit1Script: filterEvents(
                scenesLookup[sceneId]?.playerHit1Script || [],
                filter
              ),
              playerHit2Script: filterEvents(
                scenesLookup[sceneId]?.playerHit2Script || [],
                filter
              ),
              playerHit3Script: filterEvents(
                scenesLookup[sceneId]?.playerHit3Script || [],
                filter
              ),
            },
          })
        );
      });
      // Remove used instances in actors
      Object.keys(usedActors).forEach((actorId) => {
        const eventIds = usedActors[actorId].eventIds;

        const filter = (event: ScriptEvent) => !eventIds.includes(event.id);

        store.dispatch(
          entityActions.editActor({
            actorId,
            changes: {
              script: filterEvents(actorsLookup[actorId]?.script || [], filter),
              startScript: filterEvents(
                actorsLookup[actorId]?.startScript || [],
                filter
              ),
              updateScript: filterEvents(
                actorsLookup[actorId]?.updateScript || [],
                filter
              ),
              hit1Script: filterEvents(
                actorsLookup[actorId]?.hit1Script || [],
                filter
              ),
              hit2Script: filterEvents(
                actorsLookup[actorId]?.hit2Script || [],
                filter
              ),
              hit3Script: filterEvents(
                actorsLookup[actorId]?.hit3Script || [],
                filter
              ),
            },
          })
        );
      });
      // Remove used instances in triggers
      Object.keys(usedTriggers).forEach((triggerId) => {
        const eventIds = usedTriggers[triggerId].eventIds;

        const filter = (event: ScriptEvent) => !eventIds.includes(event.id);

        store.dispatch(
          entityActions.editTrigger({
            triggerId,
            changes: {
              script: filterEvents(
                triggersLookup[triggerId]?.script || [],
                filter
              ),
            },
          })
        );
      });
    }
  }

  next(action);
};

export const actions = {
  openHelp,
  openFolder,
};

export default electronMiddleware;
