import { Dispatch, Middleware } from "@reduxjs/toolkit";
import { RootState } from "store/configureStore";
import entitiesActions from "./entitiesActions";
import { selectScriptEventDefs } from "store/features/scriptEventDefs/scriptEventDefsState";
import settingsActions from "store/features/settings/settingsActions";

const entitiesMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => async (action) => {
    if (
      entitiesActions.editScriptEvent.match(action) ||
      entitiesActions.toggleScriptEventComment.match(action) ||
      entitiesActions.editScriptEventArg.match(action) ||
      entitiesActions.removeScriptEvent.match(action) ||
      entitiesActions.addScriptEvents.match(action)
    ) {
      next(action); // Keep before refreshCustomEventArgs() otherwise values are "off by one" update

      const state = store.getState();
      const editorType = state.editor.type;
      const entityId = state.editor.entityId;
      const scriptEventDefs = selectScriptEventDefs(state);

      if (editorType === "customEvent") {
        store.dispatch(
          entitiesActions.refreshCustomEventArgs({
            customEventId: entityId,
            scriptEventDefs,
          }),
        );
      }

      return;
    } else if (settingsActions.editScriptEventPreset.match(action)) {
      // Fetch values of preset from before change
      // to modify any unchanged uses of the preset
      const state = store.getState();
      const previousArgs =
        state.project.present.settings.scriptEventPresets[action.payload.id]?.[
          action.payload.presetId
        ]?.args ?? {};
      store.dispatch(
        entitiesActions.applyScriptEventPresetChanges({
          ...action.payload,
          previousArgs,
        }),
      );
    } else if (settingsActions.removeScriptEventPreset.match(action)) {
      // Fetch values of preset from before change
      // to modify any unchanged uses of the preset
      store.dispatch(
        entitiesActions.removeScriptEventPresetReferences({
          ...action.payload,
        }),
      );
    } else if (entitiesActions.removeUnusedPalettes.match(action)) {
      const state = store.getState();
      const eventDefs = selectScriptEventDefs(state);

      const paletteIds = state.project.present.entities.palettes.ids;
      const settings = state.project.present.settings;
      const usedPaletteIds = new Set<string>();

      const addUsedPaletteIds = (ids: string[]) => {
        ids.forEach((pid) => usedPaletteIds.add(pid));
      };

      // Find Palettes referenced by settings
      addUsedPaletteIds(settings.defaultBackgroundPaletteIds);
      addUsedPaletteIds(settings.defaultSpritePaletteIds);

      // Find Palettes referenced by Scenes
      for (const sceneId of state.project.present.entities.scenes.ids) {
        const scene = state.project.present.entities.scenes.entities[sceneId];
        const background =
          state.project.present.entities.backgrounds.entities[
            scene.backgroundId
          ];
        if (background?.autoColor) {
          usedPaletteIds.add(scene.paletteIds[7]); // UI Palette
        } else {
          addUsedPaletteIds(scene.paletteIds);
        }
        addUsedPaletteIds(scene.spritePaletteIds);
      }

      // Find Palettes referenced by Script Events
      for (const eventId of state.project.present.entities.scriptEvents.ids) {
        const event =
          state.project.present.entities.scriptEvents.entities[eventId];
        const eventDef = eventDefs[event.command];
        if (eventDef) {
          const paletteFieldKeys = Object.values(eventDef.fieldsLookup)
            .filter((f) => f.type === "palette")
            .map((f) => f.key) as string[];
          paletteFieldKeys.forEach((key) => {
            const paletteId = event.args?.[key];
            if (typeof paletteId === "string") {
              usedPaletteIds.add(paletteId);
            }
          });
        }
      }

      const unusedPaletteIds = paletteIds.filter(
        (pid) => !usedPaletteIds.has(pid) && !pid.startsWith("default-"),
      );

      store.dispatch(
        entitiesActions.removePalettes({
          paletteIds: unusedPaletteIds,
        }),
      );
    }

    next(action);
  };

export default entitiesMiddleware;
