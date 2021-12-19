import { ipcRenderer, remote } from "electron";
import settings from "electron-settings";
import uniq from "lodash/uniq";
import confirmDeleteCustomEvent from "lib/electron/dialog/confirmDeleteCustomEvent";
import confirmEnableColorDialog from "lib/electron/dialog/confirmEnableColorDialog";
import {
  walkEvents,
  walkSceneSpecificEvents,
  walkActorEvents,
  filterEvents,
} from "lib/helpers/eventSystem";
import { EVENT_CALL_CUSTOM_EVENT } from "lib/compiler/eventTypes";
import l10n from "lib/helpers/l10n";
import editorActions from "../editor/editorActions";
import { getSettings } from "../settings/settingsState";
import settingsActions from "../settings/settingsActions";
import { Dispatch, Middleware } from "@reduxjs/toolkit";
import { RootState } from "store/configureStore";
import projectActions from "../project/projectActions";
import {
  customEventSelectors,
  sceneSelectors,
  actorSelectors,
  triggerSelectors,
} from "../entities/entitiesState";
import { ScriptEvent } from "../entities/entitiesTypes";
import entitiesActions from "../entities/entitiesActions";
import { Dictionary } from "lodash";
import actions from "./electronActions";
import open from "open";

const electronMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => (action) => {
    if (actions.openHelp.match(action)) {
      ipcRenderer.send("open-help", action.payload);
    } else if (actions.openFolder.match(action)) {
      remote.shell.openItem(action.payload);
    } else if (actions.openFile.match(action)) {
      if (action.payload.type === "image") {
        const app = String(settings.get("imageEditorPath") || "") || undefined;
        open(action.payload.filename, { app });
      } else if (action.payload.type === "music") {
        const app = String(settings.get("musicEditorPath") || "") || undefined;
        open(action.payload.filename, { app });
      } else {
        remote.shell.openItem(action.payload.filename);
      }
    } else if (editorActions.resizeWorldSidebar.match(action)) {
      settings.set("worldSidebarWidth", action.payload);
    } else if (editorActions.resizeFilesSidebar.match(action)) {
      settings.set("filesSidebarWidth", action.payload);
    } else if (editorActions.resizeNavigatorSidebar.match(action)) {
      settings.set("navigatorSidebarWidth", action.payload);
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
    } else if (settingsActions.setShowNavigator.match(action)) {
      ipcRenderer.send("set-show-navigator", action.payload);
    } else if (projectActions.loadProject.rejected.match(action)) {
      const window = remote.getCurrentWindow();
      window.close();
    } else if (projectActions.closeProject.match(action)) {
      const window = remote.getCurrentWindow();
      window.close();
    } else if (entitiesActions.removeCustomEvent.match(action)) {
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
        event.args?.customEventId === action.payload.customEventId;

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
            entitiesActions.editScene({
              sceneId,
              changes: {
                script: filterEvents(
                  scenesLookup[sceneId]?.script || [],
                  filter
                ),
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
            entitiesActions.editActor({
              actorId,
              changes: {
                script: filterEvents(
                  actorsLookup[actorId]?.script || [],
                  filter
                ),
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
            entitiesActions.editTrigger({
              triggerId,
              changes: {
                script: filterEvents(
                  triggersLookup[triggerId]?.script || [],
                  filter
                ),
                leaveScript: filterEvents(
                  triggersLookup[triggerId]?.leaveScript || [],
                  filter
                ),
              },
            })
          );
        });
      }
    } else if (actions.showErrorBox.match(action)) {
      remote.dialog.showErrorBox(action.payload.title, action.payload.content);
    }

    next(action);
  };

export default electronMiddleware;
