import { Dispatch, Middleware } from "@reduxjs/toolkit";
import { RootState } from "store/configureStore";
import entitiesActions from "./entitiesActions";
import { selectScriptEventDefs } from "store/features/scriptEventDefs/scriptEventDefsState";
import { backgroundSelectors } from "store/features/entities/entitiesState";
import API from "renderer/lib/api";

const entitiesMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => async (action) => {
    if (
      entitiesActions.editScriptEvent.match(action) ||
      entitiesActions.editScriptEventArg.match(action) ||
      entitiesActions.removeScriptEvent.match(action) ||
      entitiesActions.addScriptEvents.match(action)
    ) {
      const state = store.getState();
      const editorType = state.editor.type;
      const entityId = state.editor.entityId;
      const scriptEventDefs = selectScriptEventDefs(state);

      if (editorType === "customEvent") {
        store.dispatch(
          entitiesActions.refreshCustomEventArgs({
            customEventId: entityId,
            scriptEventDefs,
          })
        );
      }
    }

    if (entitiesActions.renameBackground.match(action)) {
      const state = store.getState();
      const background = backgroundSelectors.selectById(
        state,
        action.payload.backgroundId
      );
      if (background) {
        const renameSuccess = await API.project.renameAsset(
          "backgrounds",
          background,
          `${action.payload.name}.png`
        );
        if (!renameSuccess) {
          return;
        }
      }
    }
    next(action);
  };

export default entitiesMiddleware;
