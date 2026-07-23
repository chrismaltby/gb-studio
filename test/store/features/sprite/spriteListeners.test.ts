import {
  configureStore,
  createListenerMiddleware,
  type Middleware,
  type UnknownAction,
} from "@reduxjs/toolkit";
import API from "renderer/lib/api";
import entitiesActions from "store/features/entities/entitiesActions";
import spriteActions from "store/features/sprite/spriteActions";
import { registerSpriteListeners } from "store/features/sprite/spriteListeners";
import type { RootState } from "store/storeTypes";
import { dummyRootState, dummySpriteSheet } from "../../../dummydata";

const flushPromises = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

const setupSpriteListeners = (includeSprite = true) => {
  const actions: UnknownAction[] = [];
  const listenerMiddleware = createListenerMiddleware<RootState>();
  registerSpriteListeners(listenerMiddleware.startListening);
  const state: RootState = {
    ...dummyRootState,
    project: {
      ...dummyRootState.project,
      present: {
        ...dummyRootState.project.present,
        entities: {
          ...dummyRootState.project.present.entities,
          spriteSheets: includeSprite
            ? {
                ids: ["sprite1"],
                entities: {
                  sprite1: {
                    ...dummySpriteSheet,
                    id: "sprite1",
                    numTiles: 1,
                    spriteMode: "8x16",
                  },
                },
              }
            : {
                ids: [],
                entities: {},
              },
        },
      },
    },
  };
  const captureActions: Middleware = () => (next) => (action) => {
    actions.push(action as UnknownAction);
    return next(action);
  };
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

afterEach(() => {
  jest.restoreAllMocks();
});

test("Should update the sprite tile count after compiling", async () => {
  type CompileSpriteResult = Awaited<
    ReturnType<typeof API.sprite.compileSprite>
  >;
  const compile = jest.spyOn(API.sprite, "compileSprite").mockResolvedValue({
    tiles: [{}, {}, {}, {}, {}, {}],
  } as CompileSpriteResult);
  const { actions, store } = setupSpriteListeners();
  const action = spriteActions.compileSprite({
    spriteSheetId: "sprite1",
  });

  store.dispatch(action);
  await flushPromises();

  expect(compile).toHaveBeenCalledTimes(1);
  expect(actions).toContainEqual(
    entitiesActions.editSpriteSheet({
      spriteSheetId: "sprite1",
      changes: { numTiles: 3 },
    }),
  );
});

test("Should forward a compile request once when the sprite does not exist", async () => {
  const compile = jest.spyOn(API.sprite, "compileSprite");
  const { actions, store } = setupSpriteListeners(false);
  const action = spriteActions.compileSprite({
    spriteSheetId: "missing",
  });

  const result = store.dispatch(action);
  await flushPromises();

  expect(result).toBe(action);
  expect(compile).not.toHaveBeenCalled();
  expect(actions).toEqual([action]);
});

test("Should request compilation after a metasprite mutation", async () => {
  const { actions, store } = setupSpriteListeners();

  store.dispatch(
    entitiesActions.addMetasprite({
      spriteSheetId: "sprite1",
      spriteAnimationId: "animation1",
      afterMetaspriteId: "",
    }),
  );

  expect(actions).toContainEqual(
    spriteActions.compileSprite({ spriteSheetId: "sprite1" }),
  );
  await flushPromises();
});
