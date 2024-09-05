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
  actorPrefabSelectors,
  triggerPrefabSelectors,
  constantSelectors,
} from "store/features/entities/entitiesState";
import entitiesActions from "store/features/entities/entitiesActions";
import actions from "./electronActions";
import API from "renderer/lib/api";
import { EVENT_CALL_CUSTOM_EVENT, NAVIGATOR_MIN_WIDTH } from "consts";
import l10n, { getL10NData } from "shared/lib/lang/l10n";
import { walkNormalizedScenesScripts } from "shared/lib/scripts/walk";
import { unwrapResult } from "@reduxjs/toolkit";
import errorActions from "store/features/error/errorActions";
import {
  actorName,
  constantName,
  triggerName,
} from "shared/lib/entities/entitiesHelpers";
import type { DeleteScriptConfirmButton } from "lib/electron/dialog/confirmDeleteCustomEvent";
import { worker } from "components/editors/ConstantEditor";
import { selectScriptEventDefs } from "store/features/scriptEventDefs/scriptEventDefsState";
import { ConstantUseResult } from "components/editors/ConstantUses.worker";

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
      API.settings.set(
        "navigatorSidebarWidth",
        Math.max(NAVIGATOR_MIN_WIDTH, action.payload)
      );
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
      API.project.updateProjectWindowMenu(action.payload.resources.settings);
    } else if (settingsActions.setShowNavigator.match(action)) {
      const state = store.getState();
      const projectSettings = getSettings(state);
      API.project.updateProjectWindowMenu({
        ...projectSettings,
        showNavigator: action.payload,
      });
    } else if (projectActions.loadProject.rejected.match(action)) {
      console.error(action);
      try {
        unwrapResult(action);
      } catch (error) {
        if (
          error &&
          typeof error === "object" &&
          "message" in error &&
          typeof error.message === "string"
        ) {
          store.dispatch(
            errorActions.setGlobalError({
              message: error.message,
              filename: "",
              line: 0,
              col: 0,
              stackTrace: error.message,
            })
          );
        }
      }
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
      const actorPrefabsLookup = actorPrefabSelectors.selectEntities(state);
      const triggerPrefabsLookup = triggerPrefabSelectors.selectEntities(state);
      const scriptEventsLookup = scriptEventSelectors.selectEntities(state);
      const allScriptEvents = scriptEventSelectors.selectAll(state);

      const usedSceneIds = [] as string[];
      const usedEventIds = [] as string[];

      const referenceIds: string[] = [];
      for (const scriptEvent of allScriptEvents) {
        if (
          scriptEvent.command === EVENT_CALL_CUSTOM_EVENT &&
          scriptEvent.args?.customEventId === action.payload.customEventId
        ) {
          referenceIds.push(scriptEvent.id);
        }
      }

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
        actorPrefabsLookup,
        triggerPrefabsLookup,
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

      const usedTotal = referenceIds.length;

      if (usedTotal > 0) {
        const sceneNames = uniq(
          usedSceneIds.map((sceneId) => sceneName(sceneId))
        ).sort();

        // Display confirmation and stop delete if cancelled
        API.dialog
          .confirmDeleteCustomEvent(customEventName, sceneNames, usedTotal)
          .then((button) => {
            const cancelButton: DeleteScriptConfirmButton.cancel = 2;
            const deleteReferencesButton: DeleteScriptConfirmButton.deleteReferences = 1;
            if (button === cancelButton) {
              return;
            }
            if (button === deleteReferencesButton) {
              return next({
                ...action,
                payload: {
                  ...action.payload,
                  deleteReferences: true,
                },
              });
            }
            return next(action);
          });
        return;
      }
    } else if (entitiesActions.removeActorPrefab.match(action)) {
      const state = store.getState();
      const actorPrefab = actorPrefabSelectors.selectById(
        state,
        action.payload.actorPrefabId
      );

      if (!actorPrefab) {
        return;
      }

      const allPrefabIds = actorPrefabSelectors.selectIds(state);
      const prefabIndex = allPrefabIds.indexOf(actorPrefab.id);
      const prefabName =
        actorPrefab.name || actorName(actorPrefab, prefabIndex);

      const actors = actorSelectors.selectAll(state);
      const usedActors = actors.filter(
        (actor) => actor.prefabId === actorPrefab.id
      );
      const usedTotal = usedActors.length;

      if (usedTotal > 0) {
        // Display confirmation and stop delete if cancelled
        API.dialog.confirmDeletePrefab(prefabName, usedTotal).then((cancel) => {
          if (cancel) {
            return;
          }

          // Unpack any actors using this prefab
          for (const usedActor of usedActors) {
            store.dispatch(
              entitiesActions.unpackActorPrefab({
                actorId: usedActor.id,
                force: true,
              })
            );
          }

          return next(action);
        });

        return;
      }
    } else if (entitiesActions.unpackActorPrefab.match(action)) {
      if (action.payload.force) {
        return next(action);
      }
      // Display confirmation and stop unpack if cancelled
      API.dialog.confirmUnpackPrefab().then((cancel) => {
        if (cancel) {
          return;
        }
        return next(action);
      });
      return;
    } else if (entitiesActions.removeTriggerPrefab.match(action)) {
      const state = store.getState();
      const triggerPrefab = triggerPrefabSelectors.selectById(
        state,
        action.payload.triggerPrefabId
      );

      if (!triggerPrefab) {
        return;
      }

      const allPrefabIds = triggerPrefabSelectors.selectIds(state);
      const prefabIndex = allPrefabIds.indexOf(triggerPrefab.id);
      const prefabName =
        triggerPrefab.name || triggerName(triggerPrefab, prefabIndex);

      const triggers = triggerSelectors.selectAll(state);
      const usedTriggers = triggers.filter(
        (trigger) => trigger.prefabId === triggerPrefab.id
      );
      const usedTotal = usedTriggers.length;

      if (usedTotal > 0) {
        // Display confirmation and stop delete if cancelled
        API.dialog.confirmDeletePrefab(prefabName, usedTotal).then((cancel) => {
          if (cancel) {
            return;
          }

          // Unpack any triggers using this prefab
          for (const usedTrigger of usedTriggers) {
            store.dispatch(
              entitiesActions.unpackTriggerPrefab({
                triggerId: usedTrigger.id,
                force: true,
              })
            );
          }

          return next(action);
        });

        return;
      }
    } else if (entitiesActions.unpackTriggerPrefab.match(action)) {
      if (action.payload.force) {
        return next(action);
      }
      // Display confirmation and stop unpack if cancelled
      API.dialog.confirmUnpackPrefab().then((cancel) => {
        if (cancel) {
          return;
        }
        return next(action);
      });
      return;
    } else if (settingsActions.removeScriptEventPreset.match(action)) {
      const state = store.getState();

      const scriptEventPreset =
        state.project.present.settings.scriptEventPresets[action.payload.id]?.[
          action.payload.presetId
        ];
      if (scriptEventPreset) {
        API.dialog
          .confirmDeletePreset(scriptEventPreset.name)
          .then((cancel) => {
            if (cancel) {
              return;
            }
            return next(action);
          });
        return;
      }
    } else if (settingsActions.editScriptEventPreset.match(action)) {
      API.dialog.confirmApplyPreset().then((cancel) => {
        if (cancel) {
          return;
        }
        return next(action);
      });
      return;
    } else if (entitiesActions.removeConstant.match(action)) {
      const state = store.getState();

      const constant = constantSelectors.selectById(
        state,
        action.payload.constantId
      );
      if (!constant) {
        return;
      }

      const allConstants = constantSelectors.selectAll(state);
      const constantIndex = allConstants.indexOf(constant);
      const name = constantName(constant, constantIndex);
      const scenes = sceneSelectors.selectAll(state);
      const actorsLookup = actorSelectors.selectEntities(state);
      const triggersLookup = triggerSelectors.selectEntities(state);
      const scriptEventsLookup = scriptEventSelectors.selectEntities(state);
      const customEventsLookup = customEventSelectors.selectEntities(state);
      const actorPrefabsLookup = actorPrefabSelectors.selectEntities(state);
      const triggerPrefabsLookup = triggerPrefabSelectors.selectEntities(state);
      const scriptEventDefs = selectScriptEventDefs(state);

      worker.postMessage({
        id: action.payload.constantId,
        constantId: action.payload.constantId,
        scenes,
        actorsLookup,
        triggersLookup,
        actorPrefabsLookup,
        triggerPrefabsLookup,
        scriptEventsLookup,
        scriptEventDefs,
        customEventsLookup,
        l10NData: getL10NData(),
      });
      worker.addEventListener(
        "message",
        (e: MessageEvent<ConstantUseResult>) => {
          const { uses } = e.data;
          if (!uses || uses.length === 0) {
            return next(action);
          }
          const useNames = uses.map((use) => use.name);
          API.dialog.confirmDeleteConstant(name, useNames).then((cancel) => {
            if (cancel) {
              return;
            }
            return next(action);
          });
        },
        { once: true }
      );
      return;
    } else if (actions.showErrorBox.match(action)) {
      API.dialog.showError(action.payload.title, action.payload.content);
    }

    return next(action);
  };

export default electronMiddleware;
