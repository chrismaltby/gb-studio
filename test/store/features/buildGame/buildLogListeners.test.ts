import {
  configureStore,
  createListenerMiddleware,
  type Middleware,
  type UnknownAction,
} from "@reduxjs/toolkit";
import consoleActions from "store/features/console/consoleActions";
import debuggerActions from "store/features/debugger/debuggerActions";
import navigationActions from "store/features/navigation/navigationActions";
import settingsActions from "store/features/settings/settingsActions";
import { registerBuildLogListeners } from "store/features/buildGame/buildLogListeners";
import type { RootState } from "store/storeTypes";

const setupBuildLogListener = (openBuildLogOnWarnings: boolean) => {
  const actions: UnknownAction[] = [];
  const listenerMiddleware = createListenerMiddleware<RootState>();
  registerBuildLogListeners(listenerMiddleware.startListening);
  const captureActions: Middleware = () => (next) => (action) => {
    actions.push(action as UnknownAction);
    return next(action);
  };
  const state = {
    project: {
      present: {
        settings: {
          openBuildLogOnWarnings,
        },
      },
    },
  } as RootState;
  const store = configureStore({
    reducer: () => state,
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

const buildLogActions = [
  settingsActions.editSettings({ debuggerEnabled: true }),
  navigationActions.setSection("world"),
  debuggerActions.setIsLogOpen(true),
];

test("Should open the build log after console error output", () => {
  const { actions, store } = setupBuildLogListener(true);
  const action = consoleActions.stdErr({ text: "Web template missing" });

  store.dispatch(action);

  expect(actions).toEqual([action, ...buildLogActions]);
});

test("Should open the build log after batched console error output", () => {
  const { actions, store } = setupBuildLogListener(true);
  const action = consoleActions.appendMany([
    { type: "out", text: "Compiling" },
    { type: "err", text: "Web template missing" },
  ]);

  store.dispatch(action);

  expect(actions).toEqual([action, ...buildLogActions]);
});

test("Should not open the build log after batched console output without errors", () => {
  const { actions, store } = setupBuildLogListener(true);
  const action = consoleActions.appendMany([{ type: "out", text: "Done" }]);

  store.dispatch(action);

  expect(actions).toEqual([action]);
});

test.each([
  consoleActions.stdErr({ text: "Web template missing" }),
  consoleActions.appendMany([{ type: "err", text: "Web template missing" }]),
])(
  "Should not open the build log when opening on warnings is disabled",
  (action) => {
    const { actions, store } = setupBuildLogListener(false);

    store.dispatch(action);

    expect(actions).toEqual([action]);
  },
);
