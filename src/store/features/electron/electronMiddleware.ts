import editorActions from "store/features/editor/editorActions";
import { getSettings } from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";
import navigationActions from "store/features/navigation/navigationActions";
import { Dispatch, Middleware, unwrapResult } from "@reduxjs/toolkit";
import { RootState } from "store/storeTypes";
import projectActions from "store/features/project/projectActions";
import {
  actorSelectors,
  triggerSelectors,
  actorPrefabSelectors,
  triggerPrefabSelectors,
} from "store/features/entities/entitiesSelectors";
import entitiesActions from "store/features/entities/entitiesActions";
import actions from "./electronActions";
import API from "renderer/lib/api";
import { NAVIGATOR_MIN_WIDTH } from "consts";
import errorActions from "store/features/error/errorActions";
import { actorName, triggerName } from "shared/lib/entities/entitiesHelpers";

const electronMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => (action) => {
    const syncProjectWindowMenu = (
      state: RootState,
      overrides?: Partial<{
        settings: ReturnType<typeof getSettings>;
        showNavigator: boolean;
        navigationSection: RootState["navigation"]["section"];
      }>,
    ) => {
      const projectSettings = overrides?.settings ?? getSettings(state);
      API.project.updateProjectWindowMenu({
        showCollisions: projectSettings.showCollisions,
        showConnections: projectSettings.showConnections,
        showNavigator:
          overrides?.showNavigator ?? projectSettings.showNavigator,
        showSceneScreenGrid: projectSettings.showSceneScreenGrid,
        navigationSection:
          overrides?.navigationSection ?? state.navigation.section,
      });
    };

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
        Math.max(NAVIGATOR_MIN_WIDTH, action.payload),
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
            }),
          );
          store.dispatch(action);
        });
        return;
      }
    } else if (projectActions.loadProject.fulfilled.match(action)) {
      const state = store.getState();
      syncProjectWindowMenu(state, {
        settings: action.payload.resources.settings,
      });
    } else if (settingsActions.setShowNavigator.match(action)) {
      const state = store.getState();
      syncProjectWindowMenu(state, {
        showNavigator: action.payload,
      });
    } else if (navigationActions.setSection.match(action)) {
      const state = store.getState();
      syncProjectWindowMenu(state, {
        navigationSection: action.payload,
      });
    } else if (projectActions.loadProject.rejected.match(action)) {
      console.error(action);
      try {
        unwrapResult(action);
      } catch (error) {
        console.error(error);
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
              stackTrace: "stack" in error ? String(error.stack) : "",
            }),
          );
        }
      }
    } else if (projectActions.closeProject.match(action)) {
      API.project.close();
    } else if (entitiesActions.removeActorPrefab.match(action)) {
      const state = store.getState();
      const actorPrefab = actorPrefabSelectors.selectById(
        state,
        action.payload.actorPrefabId,
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
        (actor) => actor.prefabId === actorPrefab.id,
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
              }),
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
        action.payload.triggerPrefabId,
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
        (trigger) => trigger.prefabId === triggerPrefab.id,
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
              }),
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
    } else if (actions.showErrorBox.match(action)) {
      API.dialog.showError(action.payload.title, action.payload.content);
    }

    return next(action);
  };

export default electronMiddleware;
