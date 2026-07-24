import {
  configureStore,
  type Middleware,
  type UnknownAction,
} from "@reduxjs/toolkit";
import API from "renderer/lib/api";
import projectActions from "store/features/project/projectActions";
import type { RootState } from "store/storeTypes";
import {
  dummyBackground,
  dummyCompressedProjectResources,
  dummyRootState,
} from "../../../dummydata";

const setupStore = (actions: UnknownAction[] = []) => {
  const state: RootState = {
    ...dummyRootState,
    project: {
      ...dummyRootState.project,
      present: {
        ...dummyRootState.project.present,
        entities: {
          ...dummyRootState.project.present.entities,
          backgrounds: {
            ids: ["background1"],
            entities: {
              background1: {
                ...dummyBackground,
                id: "background1",
                filename: "old.png",
              },
            },
          },
        },
      },
    },
  };

  const captureActions: Middleware = () => (next) => (action) => {
    actions.push(action as UnknownAction);
    return next(action);
  };

  return configureStore({
    reducer: () => state,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        immutableCheck: false,
        serializableCheck: false,
      }).concat(captureActions),
  });
};

afterEach(() => {
  jest.restoreAllMocks();
});

test("Should close the project when opening is cancelled", async () => {
  jest.spyOn(API.dialog, "migrateWarning").mockResolvedValue(false);
  const showProjectWindow = jest.spyOn(API.app, "showProjectWindow");
  const loadProject = jest.spyOn(API.project, "loadProject");
  const actions: UnknownAction[] = [];
  const store = setupStore(actions);

  await store.dispatch(projectActions.openProject("project.gbsproj"));

  expect(actions).toContainEqual(projectActions.closeProject());
  expect(showProjectWindow).not.toHaveBeenCalled();
  expect(loadProject).not.toHaveBeenCalled();
});

test("Should show the project window and load an accepted project", async () => {
  jest.spyOn(API.dialog, "migrateWarning").mockResolvedValue(true);
  const showProjectWindow = jest
    .spyOn(API.app, "showProjectWindow")
    .mockResolvedValue(undefined);
  const loadProject = jest.spyOn(API.project, "loadProject").mockResolvedValue({
    resources: dummyCompressedProjectResources,
    scriptEventDefs: {},
    engineSchema: {
      fields: [],
      sceneTypes: [],
      consts: {},
    },
    modifiedSpriteIds: [],
    isMigrated: false,
  });
  const store = setupStore();

  await store.dispatch(projectActions.openProject("project.gbsproj"));

  expect(showProjectWindow).toHaveBeenCalledTimes(1);
  expect(loadProject).toHaveBeenCalledTimes(1);
});

test("Should rename a selected background asset", async () => {
  const renameAsset = jest
    .spyOn(API.project, "renameAsset")
    .mockResolvedValue(true);
  const store = setupStore();

  await store.dispatch(
    projectActions.renameBackgroundAsset({
      backgroundId: "background1",
      newFilename: "renamed",
    }),
  );

  expect(renameAsset).toHaveBeenCalledWith(
    "backgrounds",
    expect.objectContaining({
      id: "background1",
      filename: "old.png",
    }),
    "renamed.png",
  );
});

test("Should remove a selected background asset", async () => {
  const removeAsset = jest
    .spyOn(API.project, "removeAsset")
    .mockResolvedValue(true);
  const store = setupStore();

  await store.dispatch(
    projectActions.removeBackgroundAsset({
      backgroundId: "background1",
    }),
  );

  expect(removeAsset).toHaveBeenCalledWith(
    "backgrounds",
    expect.objectContaining({ id: "background1" }),
  );
});
