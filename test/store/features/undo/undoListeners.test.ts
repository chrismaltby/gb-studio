import {
  configureStore,
  createListenerMiddleware,
  type Middleware,
  type UnknownAction,
} from "@reduxjs/toolkit";
import { ActionCreators } from "redux-undo";
import projectActions from "store/features/project/projectActions";
import { registerUndoListeners } from "store/features/undo/undoListeners";
import type { RootState } from "store/storeTypes";
import { dummyCompressedProjectResources } from "../../../dummydata";

const setupUndoListener = () => {
  const actions: UnknownAction[] = [];
  const listenerMiddleware = createListenerMiddleware<RootState>();
  registerUndoListeners(listenerMiddleware.startListening);
  const captureActions: Middleware = () => (next) => (action) => {
    actions.push(action as UnknownAction);
    return next(action);
  };
  const store = configureStore({
    reducer: () => ({}) as RootState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      })
        .prepend(listenerMiddleware.middleware)
        .concat(captureActions),
  });

  return { actions, store };
};

test("Should trigger undo clear history after successful project load", () => {
  const { actions, store } = setupUndoListener();
  const action = projectActions.loadProject.fulfilled(
    {
      resources: { ...dummyCompressedProjectResources },
      path: "project.gbsproj",
      scriptEventDefs: {},
      engineSchema: {
        fields: [],
        sceneTypes: [],
        consts: {},
      },
      modifiedSpriteIds: [],
      isMigrated: false,
    },
    "randomid",
    "project.gbsproj",
  );

  store.dispatch(action);

  expect(actions).toEqual([action, ActionCreators.clearHistory()]);
});

test("Should not trigger undo clear history after successful project save", () => {
  const { actions, store } = setupUndoListener();
  const action = projectActions.saveProject.fulfilled(
    undefined,
    "randomid",
    undefined,
  );

  store.dispatch(action);

  expect(actions).toEqual([action]);
});
