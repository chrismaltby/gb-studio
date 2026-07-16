import reducer, { initialState } from "store/features/entities/entitiesState";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import { dummyMusic, dummyMusicResource } from "../../../../dummydata";
import entitiesActions from "store/features/entities/entitiesActions";
import { MusicResourceAsset } from "shared/lib/resources/types";

test("Should add new music track if loaded while project is open", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const loadMusic: MusicResourceAsset = {
    ...dummyMusicResource,
    id: "track1",
    filename: "track1.mod",
    inode: "50",
    _v: 0,
  };

  const action = entitiesActions.loadMusic({
    data: loadMusic,
  });

  expect(state.music.ids.length).toBe(0);
  const newState = reducer(state, action);
  expect(newState.music.ids.length).toBe(1);
  expect(newState.music.entities["track1"]?.filename).toBe("track1.mod");
});

test("Should update music track if modified while project is open", () => {
  const state: EntitiesState = {
    ...initialState,
    music: {
      entities: {
        track1: {
          ...dummyMusic,
          id: "track1",
          filename: "track1.mod",
          _v: 0,
        },
      },
      ids: ["track1"],
    },
  };

  const loadMusic: MusicResourceAsset = {
    ...dummyMusicResource,
    id: "track1",
    filename: "track1.mod",
    inode: "0",
    _v: 1,
  };

  const action = entitiesActions.loadMusic({
    data: loadMusic,
  });

  expect(state.music.ids.length).toBe(1);
  const newState = reducer(state, action);
  expect(newState.music.ids.length).toBe(1);
  expect(newState.music.entities["track1"]?._v).toBe(1);
});
