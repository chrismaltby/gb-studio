/* eslint-disable camelcase */
import reducer, { initialState } from "store/features/entities/entitiesState";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import entitiesActions from "store/features/entities/entitiesActions";
import {
  MetaspriteTile,
  SpriteResourceAsset,
} from "shared/lib/resources/types";
import { v4 as uuid } from "uuid";
import { fixAllSpritesWithMissingStates } from "store/features/entities/reducers/spritesReducers";
import { createNextState } from "@reduxjs/toolkit";
import { dummySpriteSheet } from "../../../../dummydata";

jest.mock("uuid");

const mockUuid = uuid as unknown as jest.MockedFunction<() => string>;

beforeEach(() => {
  let id = 0;

  mockUuid.mockImplementation(() => {
    id += 1;
    return `uuid-${id}`;
  });
});

afterEach(() => {
  mockUuid.mockReset();
});

describe("Metasprites", () => {
  let state: EntitiesState;

  beforeEach(() => {
    // Initialize a default state before each test
    state = {
      metasprites: {
        entities: {},
        ids: [],
      },
      metaspriteTiles: {
        entities: {},
        ids: [],
      },
      spriteAnimations: {
        entities: {},
        ids: [],
      },
    } as unknown as EntitiesState;

    jest.resetAllMocks();
  });

  describe("addMetasprite", () => {
    test("should add a new metasprite after the specified metasprite ID", () => {
      const spriteAnimationId = "animation_1";
      const afterMetaspriteId = "metasprite_1";
      const newMetaspriteId = "metasprite_2";

      // Mock uuid to return a specific ID
      (uuid as jest.Mock).mockReturnValue(newMetaspriteId);

      // Set up initial state
      state.spriteAnimations.entities[spriteAnimationId] = {
        id: spriteAnimationId,
        frames: [afterMetaspriteId],
      };

      const action = entitiesActions.addMetasprite({
        spriteSheetId: "spriteSheet_1",
        spriteAnimationId,
        afterMetaspriteId,
      });

      const newState = reducer(state, action);

      expect(newState.metasprites.entities[newMetaspriteId]).toEqual({
        id: newMetaspriteId,
        tiles: [],
      });
      expect(
        newState.spriteAnimations.entities[spriteAnimationId]?.frames,
      ).toEqual([afterMetaspriteId, newMetaspriteId]);
    });

    test("should add a new metasprite at the end if afterMetaspriteId is not found", () => {
      const spriteAnimationId = "animation_1";
      const afterMetaspriteId = "non_existing_id";
      const newMetaspriteId = "metasprite_2";

      // Mock uuid to return a specific ID
      (uuid as jest.Mock).mockReturnValue(newMetaspriteId);

      // Set up initial state
      state.spriteAnimations.entities[spriteAnimationId] = {
        id: spriteAnimationId,
        frames: ["metasprite_1"],
      };

      const action = entitiesActions.addMetasprite({
        spriteSheetId: "spriteSheet_1",
        spriteAnimationId,
        afterMetaspriteId,
      });

      const newState = reducer(state, action);

      expect(newState.metasprites.entities[newMetaspriteId]).toEqual({
        id: newMetaspriteId,
        tiles: [],
      });
      expect(
        newState.spriteAnimations.entities[spriteAnimationId]?.frames,
      ).toEqual(["metasprite_1", newMetaspriteId]);
    });

    test("should do nothing if spriteAnimation does not exist", () => {
      const newMetaspriteId = "metasprite_2";

      // Mock uuid to return a specific ID
      (uuid as jest.Mock).mockReturnValue(newMetaspriteId);

      const action = entitiesActions.addMetasprite({
        spriteSheetId: "spriteSheet_1",
        spriteAnimationId: "non_existing_animation",
        afterMetaspriteId: "metasprite_1",
      });

      const newState = reducer(state, action);

      expect(newState.metasprites.entities).toEqual({});
      expect(newState.spriteAnimations.entities).toEqual({});
    });
  });

  describe("cloneMetasprites", () => {
    test("should clone metasprites and insert them after the originals", () => {
      const spriteAnimationId = "animation_1";
      const metaspriteId1 = "metasprite_1";
      const metaspriteId2 = "metasprite_2";
      const newMetaspriteId1 = "new_metasprite_1";
      const newMetaspriteId2 = "new_metasprite_2";

      let uuidCount = 0;

      // Mock uuid to return specific IDs in sequence
      (uuid as jest.Mock)
        .mockReturnValueOnce(newMetaspriteId1)
        .mockReturnValueOnce(newMetaspriteId2)
        .mockImplementation(() => "uuid_" + uuidCount++);

      // Set up initial state
      state.spriteAnimations.entities[spriteAnimationId] = {
        id: spriteAnimationId,
        frames: [metaspriteId1, metaspriteId2],
      };

      state.metasprites.entities[metaspriteId1] = {
        id: metaspriteId1,
        tiles: ["tile_1"],
      };

      state.metasprites.entities[metaspriteId2] = {
        id: metaspriteId2,
        tiles: ["tile_2"],
      };

      state.metaspriteTiles.entities["tile_1"] = {
        id: "tile_1",
        x: 0,
        y: 0,
      } as MetaspriteTile;

      state.metaspriteTiles.entities["tile_2"] = {
        id: "tile_2",
        x: 1,
        y: 1,
      } as MetaspriteTile;

      const action = entitiesActions.cloneMetasprites({
        spriteSheetId: "spriteSheet_1",
        spriteAnimationId,
        metaspriteIds: [metaspriteId1, metaspriteId2],
      });

      const newState = reducer(state, action);

      // Check if new metasprites are added
      expect(newState.metasprites.entities[newMetaspriteId1]).toBeDefined();
      expect(newState.metasprites.entities[newMetaspriteId2]).toBeDefined();

      // Check if new tiles are created
      const newTiles = Object.values(newState.metaspriteTiles.entities).filter(
        (tile) => tile.id !== "tile_1" && tile.id !== "tile_2",
      );
      expect(newTiles.length).toBe(2);

      // Check if frames are updated correctly
      expect(
        newState.spriteAnimations.entities[spriteAnimationId]?.frames,
      ).toEqual([
        metaspriteId1,
        metaspriteId2,
        newMetaspriteId1,
        newMetaspriteId2,
      ]);
    });

    test("should skip cloning if spriteAnimation does not exist", () => {
      // Mock uuid
      (uuid as jest.Mock).mockReturnValue("new_metasprite_1");

      const action = entitiesActions.cloneMetasprites({
        spriteSheetId: "spriteSheet_1",
        spriteAnimationId: "non_existing_animation",
        metaspriteIds: ["metasprite_1"],
      });

      const newState = reducer(state, action);

      expect(newState.metasprites.entities).toEqual({});
      expect(newState.spriteAnimations.entities).toEqual({});
    });
  });

  describe("removeMetasprite", () => {
    test("should remove metasprite and its tiles if more than one frame exists", () => {
      const spriteAnimationId = "animation_1";
      const metaspriteId = "metasprite_1";

      state.spriteAnimations.entities[spriteAnimationId] = {
        id: spriteAnimationId,
        frames: [metaspriteId, "metasprite_2"],
      };

      state.metasprites.entities[metaspriteId] = {
        id: metaspriteId,
        tiles: ["tile_1", "tile_2"],
      };

      const action = entitiesActions.removeMetasprite({
        metaspriteId,
        spriteAnimationId,
        spriteSheetId: "spriteSheet_1",
      });

      const newState = reducer(state, action);

      expect(newState.metasprites.entities[metaspriteId]).toBeUndefined();
      expect(
        newState.spriteAnimations.entities[spriteAnimationId]?.frames,
      ).toEqual(["metasprite_2"]);
    });

    test("should clear tiles if it's the only frame in the animation", () => {
      const spriteAnimationId = "animation_1";
      const metaspriteId = "metasprite_1";

      state.spriteAnimations.entities[spriteAnimationId] = {
        id: spriteAnimationId,
        frames: [metaspriteId],
      };

      state.metasprites.entities[metaspriteId] = {
        id: metaspriteId,
        tiles: ["tile_1", "tile_2"],
      };

      const action = entitiesActions.removeMetasprite({
        metaspriteId,
        spriteAnimationId,
        spriteSheetId: "spriteSheet_1",
      });

      const newState = reducer(state, action);

      expect(newState.metasprites.entities[metaspriteId]?.tiles).toEqual([]);
      expect(
        newState.spriteAnimations.entities[spriteAnimationId]?.frames,
      ).toEqual([metaspriteId]);
    });

    test("should do nothing if spriteAnimation does not exist", () => {
      const action = entitiesActions.removeMetasprite({
        metaspriteId: "metasprite_1",
        spriteAnimationId: "non_existing_animation",
        spriteSheetId: "spriteSheet_1",
      });

      const newState = reducer(state, action);

      expect(newState.metasprites.entities).toEqual({});
      expect(newState.spriteAnimations.entities).toEqual({});
    });
  });

  describe("removeMetasprites", () => {
    test("should remove multiple metasprites if frames remain", () => {
      const spriteAnimationId = "animation_1";
      const metaspriteIds = ["metasprite_1", "metasprite_2"];

      state.spriteAnimations.entities[spriteAnimationId] = {
        id: spriteAnimationId,
        frames: ["metasprite_1", "metasprite_2", "metasprite_3"],
      };

      state.metasprites.entities["metasprite_1"] = {
        id: "metasprite_1",
        tiles: ["tile_1"],
      };

      state.metasprites.entities["metasprite_2"] = {
        id: "metasprite_2",
        tiles: ["tile_2"],
      };

      state.metasprites.entities["metasprite_3"] = {
        id: "metasprite_3",
        tiles: ["tile_3"],
      };

      const action = entitiesActions.removeMetasprites({
        spriteSheetId: "spriteSheet_1",
        spriteAnimationId,
        metaspriteIds,
      });

      const newState = reducer(state, action);

      expect(newState.metasprites.entities["metasprite_1"]).toBeUndefined();
      expect(newState.metasprites.entities["metasprite_2"]).toBeUndefined();
      expect(
        newState.spriteAnimations.entities[spriteAnimationId]?.frames,
      ).toEqual(["metasprite_3"]);
    });

    test("should clear tiles of the first frame if no frames remain after removal", () => {
      const spriteAnimationId = "animation_1";
      const metaspriteIds = ["metasprite_1", "metasprite_2"];

      state.spriteAnimations.entities[spriteAnimationId] = {
        id: spriteAnimationId,
        frames: ["metasprite_1", "metasprite_2"],
      };

      state.metasprites.entities["metasprite_1"] = {
        id: "metasprite_1",
        tiles: ["tile_1"],
      };

      state.metasprites.entities["metasprite_2"] = {
        id: "metasprite_2",
        tiles: ["tile_2"],
      };

      const action = entitiesActions.removeMetasprites({
        spriteSheetId: "spriteSheet_1",
        spriteAnimationId,
        metaspriteIds,
      });

      const newState = reducer(state, action);

      expect(newState.metasprites.entities["metasprite_2"]).toBeUndefined();
      expect(newState.metasprites.entities["metasprite_1"]?.tiles).toEqual([]);
      expect(
        newState.spriteAnimations.entities[spriteAnimationId]?.frames,
      ).toEqual(["metasprite_1"]);
    });

    test("should do nothing if spriteAnimation does not exist", () => {
      const action = entitiesActions.removeMetasprites({
        spriteSheetId: "spriteSheet_1",
        spriteAnimationId: "non_existing_animation",
        metaspriteIds: ["metasprite_1"],
      });

      const newState = reducer(state, action);

      expect(newState.metasprites.entities).toEqual({});
      expect(newState.spriteAnimations.entities).toEqual({});
    });
  });
});

describe("fixAllSpritesWithMissingStates", () => {
  beforeEach(() => {
    let id = 0;

    mockUuid.mockImplementation(() => {
      id += 1;
      return `uuid-${id}`;
    });
  });

  afterEach(() => {
    mockUuid.mockReset();
  });

  test("Should create a default sprite state when sprite has no states", () => {
    const state = {
      spriteSheets: {
        ids: ["spriteSheet1"],
        entities: {
          spriteSheet1: {
            id: "spriteSheet1",
            states: [],
          },
        },
      },
      spriteStates: {
        ids: [],
        entities: {},
      },
      spriteAnimations: {
        ids: [],
        entities: {},
      },
      metasprites: {
        ids: [],
        entities: {},
      },
    } as unknown as EntitiesState;

    const result = createNextState(state, (draft) => {
      fixAllSpritesWithMissingStates(draft);
    });

    const sprite = result.spriteSheets.entities.spriteSheet1;
    expect(sprite?.states.length).toEqual(1);

    const spriteStateId = sprite?.states[0];
    expect(spriteStateId).toBeDefined();
    expect(result.spriteStates.entities[spriteStateId ?? ""]).toBeDefined();

    const spriteState = result.spriteStates.entities[spriteStateId ?? ""];
    expect(spriteState?.animations.length).toEqual(8);

    for (const animationId of spriteState?.animations ?? []) {
      const animation = result.spriteAnimations.entities[animationId];
      expect(animation).toBeDefined();
      expect(animation?.frames.length).toEqual(1);

      const metaspriteId = animation?.frames[0];
      expect(metaspriteId).toBeDefined();
      expect(result.metasprites.entities[metaspriteId ?? ""]).toBeDefined();
    }
  });

  test("Should create a default sprite state when sprite references missing states", () => {
    const state = {
      spriteSheets: {
        ids: ["spriteSheet1"],
        entities: {
          spriteSheet1: {
            id: "spriteSheet1",
            states: ["missingState"],
          },
        },
      },
      spriteStates: {
        ids: [],
        entities: {},
      },
      spriteAnimations: {
        ids: [],
        entities: {},
      },
      metasprites: {
        ids: [],
        entities: {},
      },
    } as unknown as EntitiesState;

    const result = createNextState(state, (draft) => {
      fixAllSpritesWithMissingStates(draft);
    });

    const sprite = result.spriteSheets.entities.spriteSheet1;
    expect(sprite?.states.length).toEqual(1);
    expect(sprite?.states).not.toContain("missingState");

    const spriteStateId = sprite?.states[0];
    expect(spriteStateId).toBeDefined();
    expect(result.spriteStates.entities[spriteStateId ?? ""]).toBeDefined();
  });

  test("Should keep existing valid sprite states and remove missing state references", () => {
    const state = {
      spriteSheets: {
        ids: ["spriteSheet1"],
        entities: {
          spriteSheet1: {
            id: "spriteSheet1",
            states: ["state1", "missingState"],
          },
        },
      },
      spriteStates: {
        ids: ["state1"],
        entities: {
          state1: {
            id: "state1",
            name: "",
            animationType: "multi_movement",
            flipLeft: true,
            animations: ["animation1"],
          },
        },
      },
      spriteAnimations: {
        ids: ["animation1"],
        entities: {
          animation1: {
            id: "animation1",
            frames: ["metasprite1"],
          },
        },
      },
      metasprites: {
        ids: ["metasprite1"],
        entities: {
          metasprite1: {
            id: "metasprite1",
            tiles: [],
          },
        },
      },
    } as unknown as EntitiesState;

    const result = createNextState(state, (draft) => {
      fixAllSpritesWithMissingStates(draft);
    });

    expect(result.spriteSheets.entities.spriteSheet1?.states).toEqual([
      "state1",
    ]);
    expect(result.spriteStates.entities.state1).toBeDefined();
  });

  test("Should create a default sprite state when all referenced states are missing", () => {
    const state = {
      spriteSheets: {
        ids: ["spriteSheet1"],
        entities: {
          spriteSheet1: {
            id: "spriteSheet1",
            states: ["missingState1", "missingState2"],
          },
        },
      },
      spriteStates: {
        ids: [],
        entities: {},
      },
      spriteAnimations: {
        ids: [],
        entities: {},
      },
      metasprites: {
        ids: [],
        entities: {},
      },
    } as unknown as EntitiesState;

    const result = createNextState(state, (draft) => {
      fixAllSpritesWithMissingStates(draft);
    });

    const sprite = result.spriteSheets.entities.spriteSheet1;
    expect(sprite?.states.length).toEqual(1);
    expect(sprite?.states).not.toContain("missingState1");
    expect(sprite?.states).not.toContain("missingState2");

    const spriteStateId = sprite?.states[0];
    expect(spriteStateId).toBeDefined();
    expect(result.spriteStates.entities[spriteStateId ?? ""]).toBeDefined();
  });
});

test("Should add new sprite sheet if loaded while project is open", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const loadSpriteSheet: SpriteResourceAsset = {
    ...dummySpriteSheet,
    id: "sprite1",
    _resourceType: "sprite",
    states: [],
  };

  const action = entitiesActions.loadSprite({
    data: loadSpriteSheet,
  });

  expect(state.spriteSheets.ids.length).toBe(0);
  const newState = reducer(state, action);
  expect(newState.spriteSheets.ids.length).toBe(1);
});

test("Should update sprite sheet if modified while project is open", () => {
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

  const loadSpriteSheet: SpriteResourceAsset = {
    ...dummySpriteSheet,
    id: "sprite1",
    filename: "sprite1.png",
    _resourceType: "sprite",
    states: [],
  };

  const action = entitiesActions.loadSprite({
    data: loadSpriteSheet,
  });

  expect(state.spriteSheets.ids.length).toBe(1);
  const newState = reducer(state, action);
  expect(newState.spriteSheets.ids.length).toBe(1);
});
