/* eslint-disable camelcase */
import reducer, {
  fixAllSpritesWithMissingStates,
  initialState,
} from "../../../../src/store/features/entities/entitiesState";
import { EntitiesState } from "../../../../src/shared/lib/entities/entitiesTypes";
import actions from "../../../../src/store/features/entities/entitiesActions";
import projectActions from "../../../../src/store/features/project/projectActions";
import {
  dummySceneNormalized,
  dummyBackground,
  dummySpriteSheet,
  dummyMusic,
  dummyCompressedSceneResource,
  dummyCompressedProjectResources,
  dummyCompressedBackgroundResource,
  dummyCustomEventNormalized,
  dummyMusicResource,
} from "../../../dummydata";
import entitiesActions from "../../../../src/store/features/entities/entitiesActions";
import {
  CompressedBackgroundResourceAsset,
  CompressedProjectResources,
  MusicResourceAsset,
  SpriteResourceAsset,
} from "shared/lib/resources/types";
import { v4 as uuid } from "uuid";
import { createNextState } from "@reduxjs/toolkit";

jest.mock("uuid");

const mockUuid = uuid as jest.MockedFunction<typeof uuid>;

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

test("Should fix scene widths if backgrounds has been removed since save", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const loadData: CompressedProjectResources = {
    ...dummyCompressedProjectResources,
    scenes: [
      {
        ...dummyCompressedSceneResource,
        id: "scene1",
        backgroundId: "missingbg",
        width: 20,
        height: 18,
      },
    ],
  };

  const action = projectActions.loadProject.fulfilled(
    {
      resources: loadData,
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
  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.width).toBe(32);
  expect(newState.scenes.entities["scene1"]?.height).toBe(32);
});

test("Should fix scene widths if backgrounds have changed dimensions since save", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const loadData: CompressedProjectResources = {
    ...dummyCompressedProjectResources,
    scenes: [
      {
        ...dummyCompressedSceneResource,
        id: "scene1",
        backgroundId: "bg1",
        width: 20,
        height: 18,
      },
    ],
    backgrounds: [
      {
        ...dummyCompressedBackgroundResource,
        id: "bg1",
        width: 64,
        height: 40,
      },
    ],
  };

  const action = projectActions.loadProject.fulfilled(
    {
      resources: loadData,
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
  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.width).toBe(64);
  expect(newState.scenes.entities["scene1"]?.height).toBe(40);
});

test("Should keep scene widths if backgrounds have NOT changed dimensions since save", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const loadData: CompressedProjectResources = {
    ...dummyCompressedProjectResources,
    scenes: [
      {
        ...dummyCompressedSceneResource,
        id: "scene1",
        backgroundId: "bg1",
        width: 20,
        height: 18,
      },
    ],
    backgrounds: [
      {
        ...dummyCompressedBackgroundResource,
        id: "bg1",
        width: 20,
        height: 18,
      },
    ],
  };

  const action = projectActions.loadProject.fulfilled(
    {
      resources: loadData,
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
  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.width).toBe(20);
  expect(newState.scenes.entities["scene1"]?.height).toBe(18);
});

test("Should fix scene widths if background has changed while project is open", () => {
  const state: EntitiesState = {
    ...initialState,
    scenes: {
      entities: {
        scene1: {
          ...dummySceneNormalized,
          id: "scene1",
          backgroundId: "bg1",
          width: 20,
          height: 18,
          actors: [],
          triggers: [],
        },
      },
      ids: ["scene1"],
    },
    backgrounds: {
      entities: {
        bg1: {
          ...dummyBackground,
          id: "bg1",
          width: 20,
          height: 18,
        },
      },
      ids: ["bg1"],
    },
  };

  const loadBackground: CompressedBackgroundResourceAsset = {
    ...dummyCompressedBackgroundResource,
    _v: 0,
    inode: "0",
    id: "bg1",
    width: 64,
    height: 40,
  };

  const action = entitiesActions.loadBackground({
    data: loadBackground,
  });

  expect(state.scenes.entities["scene1"]?.width).toBe(20);
  expect(state.scenes.entities["scene1"]?.height).toBe(18);
  const newState = reducer(state, action);
  expect(newState.scenes.entities["scene1"]?.width).toBe(64);
  expect(newState.scenes.entities["scene1"]?.height).toBe(40);
});

test("Should add new background if loaded while project is open", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const loadBackground: CompressedBackgroundResourceAsset = {
    ...dummyCompressedBackgroundResource,
    _v: 0,
    inode: "0",
    id: "bg1",
    width: 20,
    height: 18,
  };

  const action = entitiesActions.loadBackground({
    data: loadBackground,
  });

  expect(state.backgrounds.ids.length).toBe(0);
  const newState = reducer(state, action);
  expect(newState.backgrounds.ids.length).toBe(1);
  expect(newState.backgrounds.entities["bg1"]?.width).toBe(20);
  expect(newState.backgrounds.entities["bg1"]?.height).toBe(18);
});

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

test("Should be able to add custom event", () => {
  const state: EntitiesState = {
    ...initialState,
  };

  const action = actions.addCustomEvent();

  expect(state.customEvents.ids.length).toBe(0);
  const newState = reducer(state, action);
  expect(newState.customEvents.ids.length).toBe(1);
  expect(
    newState.customEvents.entities[action.payload.customEventId]?.name,
  ).toBe("CUSTOM_EVENT 1");
  expect(
    newState.customEvents.entities[action.payload.customEventId]?.script,
  ).toEqual([]);
});

describe("Custom Events", () => {
  describe("removeCustomEvent", () => {
    test("Should remove a custom event and clear references when deleteReferences is false", () => {
      const state: EntitiesState = {
        ...initialState,
        customEvents: {
          entities: {
            customEvent1: {
              ...dummyCustomEventNormalized,
              id: "customEvent1",
            },
          },
          ids: ["customEvent1"],
        },
        scriptEvents: {
          entities: {
            scriptEvent1: {
              id: "scriptEvent1",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "customEvent1" },
            },
            scriptEvent2: {
              id: "scriptEvent2",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "customEvent1" },
            },
            scriptEvent3: {
              id: "scriptEvent3",
              command: "SOME_OTHER_EVENT",
              args: {},
            },
          },
          ids: ["scriptEvent1", "scriptEvent2", "scriptEvent3"],
        },
      };

      const action = entitiesActions.removeCustomEvent({
        customEventId: "customEvent1",
        deleteReferences: false,
      });

      const newState = reducer(state, action);

      expect(newState.customEvents.entities["customEvent1"]).toBeUndefined();
      expect(newState.scriptEvents.entities["scriptEvent1"]?.id).toEqual(
        "scriptEvent1",
      );
      expect(newState.scriptEvents.entities["scriptEvent2"]?.id).toEqual(
        "scriptEvent2",
      );
      expect(
        newState.scriptEvents.entities["scriptEvent1"]?.args?.customEventId,
      ).toBeUndefined();
      expect(
        newState.scriptEvents.entities["scriptEvent2"]?.args?.customEventId,
      ).toBeUndefined();
      expect(newState.scriptEvents.entities["scriptEvent3"]?.args).toEqual({});
    });

    test("Should remove a custom event and delete references when deleteReferences is true", () => {
      const state: EntitiesState = {
        ...initialState,
        customEvents: {
          entities: {
            customEvent1: {
              ...dummyCustomEventNormalized,
              id: "customEvent1",
            },
          },
          ids: ["customEvent1"],
        },
        scriptEvents: {
          entities: {
            scriptEvent1: {
              id: "scriptEvent1",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "customEvent1" },
            },
            scriptEvent2: {
              id: "scriptEvent2",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "customEvent1" },
            },
            scriptEvent3: {
              id: "scriptEvent3",
              command: "SOME_OTHER_EVENT",
              args: {},
            },
          },
          ids: ["scriptEvent1", "scriptEvent2", "scriptEvent3"],
        },
      };

      const action = entitiesActions.removeCustomEvent({
        customEventId: "customEvent1",
        deleteReferences: true,
      });

      const newState = reducer(state, action);

      expect(newState.customEvents.entities["customEvent1"]).toBeUndefined();
      expect(newState.scriptEvents.entities["scriptEvent1"]).toBeUndefined();
      expect(newState.scriptEvents.entities["scriptEvent2"]).toBeUndefined();
      expect(newState.scriptEvents.entities["scriptEvent3"]).toBeDefined();
    });

    test("Should handle case when custom event does not exist", () => {
      const state: EntitiesState = {
        ...initialState,
        customEvents: {
          entities: {
            customEvent1: {
              ...dummyCustomEventNormalized,
              id: "customEvent1",
            },
          },
          ids: ["customEvent1"],
        },
        scriptEvents: {
          entities: {
            scriptEvent1: {
              id: "scriptEvent1",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "customEvent1" },
            },
            scriptEvent2: {
              id: "scriptEvent2",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "customEvent1" },
            },
          },
          ids: ["scriptEvent1", "scriptEvent2"],
        },
      };

      const action = entitiesActions.removeCustomEvent({
        customEventId: "nonexistent_custom_event",
        deleteReferences: false,
      });

      const newState = reducer(state, action);

      expect(newState.customEvents.entities["customEvent1"]).toBeDefined();
      expect(
        newState.scriptEvents.entities["scriptEvent1"]?.args?.customEventId,
      ).toBe("customEvent1");
      expect(
        newState.scriptEvents.entities["scriptEvent2"]?.args?.customEventId,
      ).toBe("customEvent1");
    });

    test("Should not modify script events that do not reference the removed custom event", () => {
      const state: EntitiesState = {
        ...initialState,
        customEvents: {
          entities: {
            customEvent1: {
              ...dummyCustomEventNormalized,
              id: "customEvent1",
            },
          },
          ids: ["customEvent1"],
        },
        scriptEvents: {
          entities: {
            scriptEvent1: {
              id: "scriptEvent1",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "customEvent1" },
            },
            scriptEvent2: {
              id: "scriptEvent2",
              command: "EVENT_CALL_CUSTOM_EVENT",
              args: { customEventId: "someOtherCustomEvent" },
            },
          },
          ids: ["scriptEvent1", "scriptEvent2"],
        },
      };

      const action = entitiesActions.removeCustomEvent({
        customEventId: "customEvent1",
        deleteReferences: false,
      });

      const newState = reducer(state, action);

      expect(newState.customEvents.entities["customEvent1"]).toBeUndefined();
      expect(
        newState.scriptEvents.entities["scriptEvent1"]?.args?.customEventId,
      ).toBeUndefined();
      expect(
        newState.scriptEvents.entities["scriptEvent2"]?.args?.customEventId,
      ).toBe("someOtherCustomEvent");
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
