/* eslint-disable camelcase */
import reducer, { initialState } from "store/features/entities/entitiesState";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import {
  dummyBackground,
  dummySpriteSheet,
  dummyMusic,
} from "../../../../dummydata";
import entitiesActions from "store/features/entities/entitiesActions";

test("Should remove backgrounds that are deleted while project is open", () => {
  const state: EntitiesState = {
    ...initialState,
    backgrounds: {
      entities: {
        bg1: {
          ...dummyBackground,
          id: "bg1",
          filename: "bg1.png",
        },
      },
      ids: ["bg1"],
    },
  };

  const action = entitiesActions.removedAsset({
    assetType: "backgrounds",
    asset: {
      filename: "bg1.png",
      plugin: undefined,
    },
  });

  expect(state.backgrounds.ids.length).toBe(1);
  const newState = reducer(state, action);
  expect(newState.backgrounds.ids.length).toBe(0);
});

test("Should remove sprite sheets that are deleted while project is open", () => {
  const state: EntitiesState = {
    ...initialState,
    spriteSheets: {
      entities: {
        sprite1: {
          ...dummySpriteSheet,
          id: "sprite1",
          filename: "sprite1.png",
        },
      },
      ids: ["sprite1"],
    },
  };

  const action = entitiesActions.removedAsset({
    assetType: "sprites",
    asset: {
      filename: "sprite1.png",
      plugin: undefined,
    },
  });

  expect(state.spriteSheets.ids.length).toBe(1);
  const newState = reducer(state, action);
  expect(newState.spriteSheets.ids.length).toBe(0);
});

test("Should remove music tracks that are deleted while project is open", () => {
  const state: EntitiesState = {
    ...initialState,
    music: {
      entities: {
        track1: {
          ...dummyMusic,
          id: "track1",
          filename: "track1.mod",
        },
      },
      ids: ["track1"],
    },
  };

  const action = entitiesActions.removedAsset({
    assetType: "music",
    asset: {
      filename: "track1.mod",
      plugin: undefined,
    },
  });

  expect(state.music.ids.length).toBe(1);
  const newState = reducer(state, action);
  expect(newState.music.ids.length).toBe(0);
});
