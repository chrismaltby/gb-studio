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
    }

    next(action);
  };

export default entitiesMiddleware;
