import uniq from "lodash/uniq";
import editorActions from "store/features/editor/editorActions";
import { getSettings } from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";
import { Dispatch, Middleware } from "@reduxjs/toolkit";
import { RootState } from "store/configureStore";
import projectActions from "store/features/project/projectActions";
import {
  customEventSelectors,
  sceneSelectors,
  actorSelectors,
  triggerSelectors,
  scriptEventSelectors,
} from "store/features/entities/entitiesState";
import entitiesActions from "store/features/entities/entitiesActions";
import actions from "./electronActions";
import API from "renderer/lib/api";
import { EVENT_CALL_CUSTOM_EVENT } from "consts";
import l10n from "shared/lib/lang/l10n";
import { walkNormalizedScenesScripts } from "shared/lib/scripts/walk";

const electronMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => async (action) => {
    if (actions.openHelp.match(action)) {
      API.app.openHelp(action.payload);
    } else if (actions.openFolder.match(action)) {
      API.app.openFolder(action.payload);
    } else if (actions.openFile.match(action)) {
      if (action.payload.type === "image") {
        API.app.openImageFile(action.payload.filename);
      } else if (action.payload.type === "music") {
        API.app.openModFile(action.payload.filename);
      } else {
        API.app.openFile(action.payload.filename);
      }
    } else if (editorActions.resizeWorldSidebar.match(action)) {
      API.settings.set("worldSidebarWidth", action.payload);
    } else if (editorActions.resizeFilesSidebar.match(action)) {
      API.settings.set("filesSidebarWidth", action.payload);
    } else if (editorActions.resizeNavigatorSidebar.match(action)) {
      API.settings.set("navigatorSidebarWidth", action.payload);
    } else if (
      editorActions.setTool.match(action) &&
      action.payload.tool === "colors"
    ) {
      const state = store.getState();
      const projectSettings = getSettings(state);
      if (projectSettings.colorMode === "mono") {
        API.dialog.confirmEnableColorDialog().then((cancel) => {
          if (cancel) {
            return;
          }
          store.dispatch(
            settingsActions.editSettings({
              colorMode: "mixed",
            })
          );
          store.dispatch(action);
        });
        return;
      }
    } else if (projectActions.loadProject.fulfilled.match(action)) {
      API.project.updateProjectWindowMenu(action.payload.data.settings);
    } else if (settingsActions.setShowNavigator.match(action)) {
      const state = store.getState();
      const projectSettings = getSettings(state);
      API.project.updateProjectWindowMenu({
        ...projectSettings,
        showNavigator: action.payload,
      });
    } else if (projectActions.loadProject.rejected.match(action)) {
      API.project.close();
    } else if (projectActions.closeProject.match(action)) {
      API.project.close();
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
      const scriptEventsLookup = scriptEventSelectors.selectEntities(state);

      const usedSceneIds = [] as string[];
      const usedEventIds = [] as string[];

      const sceneName = (sceneId: string) => {
        const scene = scenesLookup[sceneId];
        const sceneIndex = scene ? scenes.indexOf(scene) : 0;
        return scene?.name || `${l10n("SCENE")} ${sceneIndex + 1}`;
      };

      // Check for uses of this custom event in project
      walkNormalizedScenesScripts(
        scenes,
        scriptEventsLookup,
        actorsLookup,
        triggersLookup,
        undefined,
        (scriptEvent, scene) => {
          if (
            scriptEvent.command === EVENT_CALL_CUSTOM_EVENT &&
            scriptEvent.args?.customEventId === action.payload.customEventId
          ) {
            usedSceneIds.push(scene.id);
            usedEventIds.push(scriptEvent.id);
          }
        }
      );

      const usedTotal = usedSceneIds.length;

      if (usedTotal > 0) {
        const sceneNames = uniq(
          usedSceneIds.map((sceneId) => sceneName(sceneId))
        ).sort();

        // Display confirmation and stop delete if cancelled
        API.dialog
          .confirmDeleteCustomEvent(customEventName, sceneNames, usedTotal)
          .then((cancel) => {
            if (cancel) {
              return;
            }

            // Remove any references to this custom event
            for (const usedEventId of usedEventIds) {
              store.dispatch(
                entitiesActions.editScriptEvent({
                  scriptEventId: usedEventId,
                  changes: {
                    args: {
                      customEventId: "",
                    },
                  },
                })
              );
            }

            return next(action);
          });
        return;
      }
    } else if (actions.showErrorBox.match(action)) {
      API.dialog.showError(action.payload.title, action.payload.content);
    }

    return next(action);
  };

export default electronMiddleware;
