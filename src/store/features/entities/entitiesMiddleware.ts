import { Dispatch, Middleware } from "@reduxjs/toolkit";
import { RootState } from "store/configureStore";
import entitiesActions from "./entitiesActions";
import { selectScriptEventDefs } from "store/features/scriptEventDefs/scriptEventDefsState";

const entitiesMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => async (action) => {
    next(action); // Keep before refreshCustomEventArgs() otherwise values are "off by one" update
    if (
      entitiesActions.editScriptEvent.match(action) ||
      entitiesActions.toggleScriptEventComment.match(action) ||
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
  };

export default entitiesMiddleware;
