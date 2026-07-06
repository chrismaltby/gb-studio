import { EntityState } from "@reduxjs/toolkit";
import {
  isActorPrefabEqual,
  isTriggerPrefabEqual,
  ensureEntitySymbolsUnique,
  getMetaspriteTilesForSpriteSheet,
  nextIndexedName,
  applyReparentFolderToCollection,
  applyReparentEntityToCollection,
  pruneMissingEntities,
  denormalizeEntities,
  updateCustomEventArgs,
} from "shared/lib/entities/entitiesHelpers";
import { initialState as initialEntitiesState } from "store/features/entities/entitiesState";
import {
  ActorPrefabNormalized,
  EntitiesState,
  ScriptEventNormalized,
  TriggerPrefabNormalized,
} from "shared/lib/entities/entitiesTypes";
import {
  dummyActorPrefabNormalized,
  dummyTriggerPrefabNormalized,
} from "../dummydata";
import cloneDeep from "lodash/cloneDeep";
import { schema } from "normalizr";

describe("isActorPrefabEqual", () => {
  it("should return true if prefabs and scripts are equal", () => {
    const prefabA: ActorPrefabNormalized = {
      ...dummyActorPrefabNormalized,
      id: "1",
      name: "My Prefab",
      script: ["event1"],
    };
    const prefabB: ActorPrefabNormalized = {
      ...dummyActorPrefabNormalized,
      id: "1",
      name: "My Prefab",
      script: ["event1"],
    };
    const lookupA: Record<string, ScriptEventNormalized> = {
      event1: { id: "My Prefab", command: "CMD", args: { foo: "bar" } },
    };
    const lookupB: Record<string, ScriptEventNormalized> = {
      event1: { id: "My Prefab", command: "CMD", args: { foo: "bar" } },
    };
    const result = isActorPrefabEqual(prefabA, lookupA, prefabB, lookupB);
    expect(result).toBe(true);
  });

  it("should ignore id when comparing prefabs", () => {
    const prefabA: ActorPrefabNormalized = {
      ...dummyActorPrefabNormalized,
      id: "1",
      name: "My Prefab",
      script: ["event1"],
    };
    const prefabB: ActorPrefabNormalized = {
      ...dummyActorPrefabNormalized,
      id: "2",
      name: "My Prefab",
      script: ["event1"],
    };
    const lookupA: Record<string, ScriptEventNormalized> = {
      event1: { id: "My Prefab", command: "CMD", args: { foo: "bar" } },
    };
    const lookupB: Record<string, ScriptEventNormalized> = {
      event1: { id: "My Prefab", command: "CMD", args: { foo: "bar" } },
    };
    const result = isActorPrefabEqual(prefabA, lookupA, prefabB, lookupB);
    expect(result).toBe(true);
  });

  it("should return false if prefabs are not equal based on properties", () => {
    const prefabA: ActorPrefabNormalized = {
      ...dummyActorPrefabNormalized,
      id: "1",
      name: "My Prefab",
      script: ["event1"],
    };
    const prefabB: ActorPrefabNormalized = {
      ...dummyActorPrefabNormalized,
      id: "2",
      name: "Another Prefab",
      script: ["event1"],
    };
    const lookupA: Record<string, ScriptEventNormalized> = {
      event1: { id: "My Prefab", command: "CMD", args: { foo: "bar" } },
    };
    const lookupB: Record<string, ScriptEventNormalized> = {
      event1: { id: "My Prefab", command: "CMD", args: { foo: "bar" } },
    };
    const result = isActorPrefabEqual(prefabA, lookupA, prefabB, lookupB);
    expect(result).toBe(false);
  });

  it("should return false if scripts are not equal", () => {
    const prefabA: ActorPrefabNormalized = {
      ...dummyActorPrefabNormalized,
      id: "1",
      name: "My Prefab",
      script: ["event1"],
    };
    const prefabB: ActorPrefabNormalized = {
      ...dummyActorPrefabNormalized,
      id: "2",
      name: "My Prefab",
      script: ["event1"],
    };
    const lookupA: Record<string, ScriptEventNormalized> = {
      event1: { id: "My Prefab", command: "CMD", args: { foo: "bar" } },
    };
    const lookupB: Record<string, ScriptEventNormalized> = {
      event1: { id: "My Prefab", command: "CMD", args: { foo: "baz" } },
    };
    const result = isActorPrefabEqual(prefabA, lookupA, prefabB, lookupB);
    expect(result).toBe(false);
  });
});

describe("isTriggerPrefabEqual", () => {
  it("should return true if prefabs and scripts are equal", () => {
    const prefabA: TriggerPrefabNormalized = {
      ...dummyTriggerPrefabNormalized,
      id: "1",
      name: "My Prefab",
      script: ["event1"],
    };
    const prefabB: TriggerPrefabNormalized = {
      ...dummyTriggerPrefabNormalized,
      id: "1",
      name: "My Prefab",
      script: ["event1"],
    };
    const lookupA: Record<string, ScriptEventNormalized> = {
      event1: { id: "My Prefab", command: "CMD", args: { foo: "bar" } },
    };
    const lookupB: Record<string, ScriptEventNormalized> = {
      event1: { id: "My Prefab", command: "CMD", args: { foo: "bar" } },
    };
    const result = isTriggerPrefabEqual(prefabA, lookupA, prefabB, lookupB);
    expect(result).toBe(true);
  });

  it("should ignore id when comparing prefabs", () => {
    const prefabA: TriggerPrefabNormalized = {
      ...dummyTriggerPrefabNormalized,
      id: "1",
      name: "My Prefab",
      script: ["event1"],
    };
    const prefabB: TriggerPrefabNormalized = {
      ...dummyTriggerPrefabNormalized,
      id: "2",
      name: "My Prefab",
      script: ["event1"],
    };
    const lookupA: Record<string, ScriptEventNormalized> = {
      event1: { id: "My Prefab", command: "CMD", args: { foo: "bar" } },
    };
    const lookupB: Record<string, ScriptEventNormalized> = {
      event1: { id: "My Prefab", command: "CMD", args: { foo: "bar" } },
    };
    const result = isTriggerPrefabEqual(prefabA, lookupA, prefabB, lookupB);
    expect(result).toBe(true);
  });

  it("should return false if prefabs are not equal based on properties", () => {
    const prefabA: TriggerPrefabNormalized = {
      ...dummyTriggerPrefabNormalized,
      id: "1",
      name: "My Prefab",
      script: ["event1"],
    };
    const prefabB: TriggerPrefabNormalized = {
      ...dummyTriggerPrefabNormalized,
      id: "2",
      name: "Another Prefab",
      script: ["event1"],
    };
    const lookupA: Record<string, ScriptEventNormalized> = {
      event1: { id: "My Prefab", command: "CMD", args: { foo: "bar" } },
    };
    const lookupB: Record<string, ScriptEventNormalized> = {
      event1: { id: "My Prefab", command: "CMD", args: { foo: "bar" } },
    };
    const result = isTriggerPrefabEqual(prefabA, lookupA, prefabB, lookupB);
    expect(result).toBe(false);
  });

  it("should return false if scripts are not equal", () => {
    const prefabA: TriggerPrefabNormalized = {
      ...dummyTriggerPrefabNormalized,
      id: "1",
      name: "My Prefab",
      script: ["event1"],
    };
    const prefabB: TriggerPrefabNormalized = {
      ...dummyTriggerPrefabNormalized,
      id: "2",
      name: "My Prefab",
      script: ["event1"],
    };
    const lookupA: Record<string, ScriptEventNormalized> = {
      event1: { id: "My Prefab", command: "CMD", args: { foo: "bar" } },
    };
    const lookupB: Record<string, ScriptEventNormalized> = {
      event1: { id: "My Prefab", command: "CMD", args: { foo: "baz" } },
    };
    const result = isTriggerPrefabEqual(prefabA, lookupA, prefabB, lookupB);
    expect(result).toBe(false);
  });
});

describe("ensureEntitySymbolsUnique", () => {
  test("Should ensure unique symbols for entities", () => {
    const state: EntityState<{ id: string; symbol?: string }, string> = {
      ids: ["e1", "e2"],
      entities: {
        e1: {
          id: "e1",
          symbol: "entity",
        },
        e2: {
          id: "e1",
          symbol: "entity",
        },
      },
    };
    const seenSymbols = new Set<string>();
    ensureEntitySymbolsUnique(state, seenSymbols);
    expect(state.entities.e1?.symbol).toBe("entity");
    expect(state.entities.e2?.symbol).toBe("entity_0");
  });

  test("Should not modify symbols that are already unique", () => {
    const state: EntityState<{ id: string; symbol?: string }, string> = {
      ids: ["e1", "e2"],
      entities: {
        e1: {
          id: "e1",
          symbol: "entity1",
        },
        e2: {
          id: "e1",
          symbol: "entity2",
        },
      },
    };
    const seenSymbols = new Set<string>();
    ensureEntitySymbolsUnique(state, seenSymbols);
    expect(state.entities.e1?.symbol).toBe("entity1");
    expect(state.entities.e2?.symbol).toBe("entity2");
  });

  test("Should ensure unique symbols for entities when current symbol isn't defined", () => {
    const state: EntityState<{ id: string; symbol?: string }, string> = {
      ids: ["e1", "e2"],
      entities: {
        e1: {
          id: "e1",
        },
        e2: {
          id: "e1",
        },
      },
    };
    const seenSymbols = new Set<string>();
    ensureEntitySymbolsUnique(state, seenSymbols);
    expect(state.entities.e1?.symbol).toBe("symbol");
    expect(state.entities.e2?.symbol).toBe("symbol_0");
  });

  test("Should ensure unique symbols for entities when current symbol is an empty string", () => {
    const state: EntityState<{ id: string; symbol?: string }, string> = {
      ids: ["e1", "e2"],
      entities: {
        e1: {
          id: "e1",
          symbol: "",
        },
        e2: {
          id: "e1",
          symbol: "",
        },
      },
    };
    const seenSymbols = new Set<string>();
    ensureEntitySymbolsUnique(state, seenSymbols);
    expect(state.entities.e1?.symbol).toBe("symbol");
    expect(state.entities.e2?.symbol).toBe("symbol_0");
  });
});

describe("getMetaspriteTilesForSpriteSheet", () => {
  test("Should return all metasprite tiles associated with the given sprite sheet id", () => {
    const state = {
      spriteSheets: {
        entities: {
          spriteSheet1: {
            id: "spriteSheet1",
            states: ["state1", "state2"],
          },
        },
      },
      spriteStates: {
        entities: {
          state1: {
            id: "state1",
            animations: ["anim1"],
          },
          state2: {
            id: "state2",
            animations: ["anim2"],
          },
        },
      },
      spriteAnimations: {
        entities: {
          anim1: {
            id: "anim1",
            frames: ["frame1"],
          },
          anim2: {
            id: "anim2",
            frames: ["frame2"],
          },
        },
      },
      metasprites: {
        entities: {
          frame1: {
            id: "frame1",
            tiles: ["tile1", "tile2"],
          },
          frame2: {
            id: "frame1",
            tiles: ["tile4"],
          },
        },
      },
      metaspriteTiles: {
        entities: {
          tile1: {
            id: "tile1",
          },
          tile2: {
            id: "tile2",
          },
          tile3: {
            id: "tile3",
          },
          tile4: {
            id: "tile4",
          },
        },
      },
    } as unknown as EntitiesState;
    const spriteTiles = getMetaspriteTilesForSpriteSheet(state, "spriteSheet1");
    expect(spriteTiles.length).toEqual(3);
    expect(spriteTiles.map((t) => t.id)).toEqual(["tile1", "tile2", "tile4"]);
  });

  test("Should not return duplicate metasprite tiles", () => {
    const state = {
      spriteSheets: {
        entities: {
          spriteSheet1: {
            id: "spriteSheet1",
            states: ["state1", "state2"],
          },
        },
      },
      spriteStates: {
        entities: {
          state1: {
            id: "state1",
            animations: ["anim1"],
          },
          state2: {
            id: "state2",
            animations: ["anim2"],
          },
        },
      },
      spriteAnimations: {
        entities: {
          anim1: {
            id: "anim1",
            frames: ["frame1"],
          },
          anim2: {
            id: "anim2",
            frames: ["frame2"],
          },
        },
      },
      metasprites: {
        entities: {
          frame1: {
            id: "frame1",
            tiles: ["tile1", "tile1"],
          },
          frame2: {
            id: "frame1",
            tiles: ["tile1", "tile1"],
          },
        },
      },
      metaspriteTiles: {
        entities: {
          tile1: {
            id: "tile1",
          },
          tile2: {
            id: "tile2",
          },
          tile3: {
            id: "tile3",
          },
          tile4: {
            id: "tile4",
          },
        },
      },
    } as unknown as EntitiesState;
    const spriteTiles = getMetaspriteTilesForSpriteSheet(state, "spriteSheet1");
    expect(spriteTiles.length).toEqual(1);
    expect(spriteTiles.map((t) => t.id)).toEqual(["tile1"]);
  });

  test("Should ignore missing sprite state references", () => {
    const state = {
      spriteSheets: {
        entities: {
          spriteSheet1: {
            id: "spriteSheet1",
            states: ["state1", "missingState"],
          },
        },
      },
      spriteStates: {
        entities: {
          state1: {
            id: "state1",
            animations: ["anim1"],
          },
        },
      },
      spriteAnimations: {
        entities: {
          anim1: {
            id: "anim1",
            frames: ["frame1"],
          },
        },
      },
      metasprites: {
        entities: {
          frame1: {
            id: "frame1",
            tiles: ["tile1"],
          },
        },
      },
      metaspriteTiles: {
        entities: {
          tile1: {
            id: "tile1",
          },
        },
      },
    } as unknown as EntitiesState;

    const spriteTiles = getMetaspriteTilesForSpriteSheet(state, "spriteSheet1");

    expect(spriteTiles.length).toEqual(1);
    expect(spriteTiles.map((t) => t.id)).toEqual(["tile1"]);
  });

  test("Should ignore missing sprite animation references", () => {
    const state = {
      spriteSheets: {
        entities: {
          spriteSheet1: {
            id: "spriteSheet1",
            states: ["state1"],
          },
        },
      },
      spriteStates: {
        entities: {
          state1: {
            id: "state1",
            animations: ["anim1", "missingAnim"],
          },
        },
      },
      spriteAnimations: {
        entities: {
          anim1: {
            id: "anim1",
            frames: ["frame1"],
          },
        },
      },
      metasprites: {
        entities: {
          frame1: {
            id: "frame1",
            tiles: ["tile1"],
          },
        },
      },
      metaspriteTiles: {
        entities: {
          tile1: {
            id: "tile1",
          },
        },
      },
    } as unknown as EntitiesState;

    const spriteTiles = getMetaspriteTilesForSpriteSheet(state, "spriteSheet1");

    expect(spriteTiles.length).toEqual(1);
    expect(spriteTiles.map((t) => t.id)).toEqual(["tile1"]);
  });

  test("Should ignore missing metasprite references", () => {
    const state = {
      spriteSheets: {
        entities: {
          spriteSheet1: {
            id: "spriteSheet1",
            states: ["state1"],
          },
        },
      },
      spriteStates: {
        entities: {
          state1: {
            id: "state1",
            animations: ["anim1"],
          },
        },
      },
      spriteAnimations: {
        entities: {
          anim1: {
            id: "anim1",
            frames: ["frame1", "missingFrame"],
          },
        },
      },
      metasprites: {
        entities: {
          frame1: {
            id: "frame1",
            tiles: ["tile1"],
          },
        },
      },
      metaspriteTiles: {
        entities: {
          tile1: {
            id: "tile1",
          },
        },
      },
    } as unknown as EntitiesState;

    const spriteTiles = getMetaspriteTilesForSpriteSheet(state, "spriteSheet1");

    expect(spriteTiles.length).toEqual(1);
    expect(spriteTiles.map((t) => t.id)).toEqual(["tile1"]);
  });

  test("Should ignore missing metasprite tile references", () => {
    const state = {
      spriteSheets: {
        entities: {
          spriteSheet1: {
            id: "spriteSheet1",
            states: ["state1"],
          },
        },
      },
      spriteStates: {
        entities: {
          state1: {
            id: "state1",
            animations: ["anim1"],
          },
        },
      },
      spriteAnimations: {
        entities: {
          anim1: {
            id: "anim1",
            frames: ["frame1"],
          },
        },
      },
      metasprites: {
        entities: {
          frame1: {
            id: "frame1",
            tiles: ["tile1", "missingTile"],
          },
        },
      },
      metaspriteTiles: {
        entities: {
          tile1: {
            id: "tile1",
          },
        },
      },
    } as unknown as EntitiesState;

    const spriteTiles = getMetaspriteTilesForSpriteSheet(state, "spriteSheet1");

    expect(spriteTiles.length).toEqual(1);
    expect(spriteTiles.map((t) => t.id)).toEqual(["tile1"]);
  });
});

describe("nextIndexedName", () => {
  test("Should return next indexed name when no conflicts", () => {
    const existingNames = ["Palette", "Palette 0", "Palette 1"];
    const nextName = nextIndexedName("Palette", existingNames);
    expect(nextName).toBe("Palette 2");
  });
  test("Should increment index when match is found", () => {
    const existingNames = ["Palette"];
    const nextName = nextIndexedName("Palette", existingNames);
    expect(nextName).toBe("Palette 1");
  });
  test("Should continue to increment index when multiple matches are found", () => {
    const existingNames = ["Palette", "Palette 1"];
    const nextName = nextIndexedName("Palette", existingNames);
    expect(nextName).toBe("Palette 2");
  });
  test("Should fill gaps in indexing", () => {
    const existingNames = ["Palette", "Palette 1", "Palette 3"];
    const nextName = nextIndexedName("Palette", existingNames);
    expect(nextName).toBe("Palette 2");
  });
});

describe("updateCustomEventArgs", () => {
  test("Should include custom event variables referenced by data table fields", () => {
    const customEvent = {
      id: "customEvent1",
      name: "Custom Event 1",
      description: "",
      symbol: "custom_event_1",
      variables: {
        V1: {
          id: "V1",
          name: "Existing Variable",
          passByReference: false,
        },
      },
      actors: {},
      script: ["event1"],
    } as Parameters<typeof updateCustomEventArgs>[0];

    updateCustomEventArgs(
      customEvent,
      {
        event1: {
          id: "event1",
          command: "EVENT_DATA_TABLE",
          args: {
            data: {
              variables: ["V1", "0", "T0"],
              rows: [
                {
                  label: "Row 1",
                  values: [{ type: "number", value: 1 }],
                },
              ],
            },
          },
        },
      },
      {
        EVENT_DATA_TABLE: {
          id: "EVENT_DATA_TABLE",
          fieldsLookup: {
            data: {
              key: "data",
              type: "dataTable",
            },
          },
        },
      } as never,
    );

    expect(customEvent.variables).toEqual({
      V1: {
        id: "V1",
        name: "Existing Variable",
        passByReference: false,
      },
    });
  });

  test("Should sort variables by id", () => {
    const customEvent = {
      id: "customEvent1",
      name: "Custom Event 1",
      description: "",
      symbol: "custom_event_1",
      variables: {},
      actors: {},
      script: ["event1", "event2"],
    } as Parameters<typeof updateCustomEventArgs>[0];

    updateCustomEventArgs(
      customEvent,
      {
        event1: {
          id: "event1",
          command: "EVENT_INC_VALUE",
          args: {
            variable: "V5",
          },
        },
        event2: {
          id: "event2",
          command: "EVENT_INC_VALUE",
          args: {
            variable: "V3",
          },
        },
      },
      {
        EVENT_INC_VALUE: {
          id: "EVENT_INC_VALUE",
          fieldsLookup: {
            variable: {
              key: "variable",
              type: "variable",
            },
          },
        },
      } as never,
    );

    expect(Object.keys(customEvent.variables)).toEqual(["V3", "V5"]);
  });
});

describe("applyReparentFolderToCollection", () => {
  type Entity = { name: string };

  test("should not allow moving a single file path", () => {
    const collection: Record<string, Entity> = {
      a: { name: "folder/file.txt" },
      b: { name: "folder/other.txt" },
    };

    applyReparentFolderToCollection(collection, "folder/file.txt", "newFolder");

    expect(collection.a?.name).toBe("folder/file.txt");
    expect(collection.b?.name).toBe("folder/other.txt");
  });

  test("should move all files within folder", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a" },
      b: { name: "a/file.txt" },
      c: { name: "a/sub/file2.txt" },
      d: { name: "other/file3.txt" },
    };

    applyReparentFolderToCollection(collection, "a", "x");

    expect(collection.a?.name).toBe("a");
    expect(collection.b?.name).toBe("x/a/file.txt");
    expect(collection.c?.name).toBe("x/a/sub/file2.txt");
    expect(collection.d?.name).toBe("other/file3.txt");
  });

  test("should move nested folder and its contents correctly", () => {
    const collection: Record<string, Entity> = {
      a: { name: "root/a" },
      b: { name: "root/a/file.txt" },
      c: { name: "root/a/sub/file2.txt" },
    };

    applyReparentFolderToCollection(collection, "root/a", "x/y");

    expect(collection.a?.name).toBe("root/a");
    expect(collection.b?.name).toBe("x/y/a/file.txt");
    expect(collection.c?.name).toBe("x/y/a/sub/file2.txt");
  });

  test("should allow moving folder to root", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a" },
      b: { name: "a/file.txt" },
    };

    applyReparentFolderToCollection(collection, "a", "");

    expect(collection.a?.name).toBe("a");
    expect(collection.b?.name).toBe("a/file.txt");
  });

  test("should do nothing if draggedPath does not match anything", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a/file.txt" },
      b: { name: "b/file.txt" },
    };

    applyReparentFolderToCollection(collection, "x", "y");

    expect(collection.a?.name).toBe("a/file.txt");
    expect(collection.b?.name).toBe("b/file.txt");
  });

  test("should ignore undefined entries in collection", () => {
    const collection: Record<string, Entity | undefined> = {
      a: { name: "a/file.txt" },
      b: undefined,
    };

    applyReparentFolderToCollection(collection, "a", "x");

    expect(collection.a?.name).toBe("x/a/file.txt");
  });

  test("should normalize during reparenting", () => {
    const collection: Record<string, Entity> = {
      a: { name: "\\a//file.txt" },
    };

    applyReparentFolderToCollection(collection, "a", "x");

    expect(collection.a?.name).toBe("x/a/file.txt");
  });

  test("should not partially match similar prefixes", () => {
    const collection: Record<string, Entity> = {
      a: { name: "folderA/file.txt" },
    };

    applyReparentFolderToCollection(collection, "folder", "x");

    expect(collection.a?.name).toBe("folderA/file.txt");
  });

  test("should not allow moving folder into itself", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a/file.txt" },
    };

    applyReparentFolderToCollection(collection, "a", "a");

    expect(collection.a?.name).toBe("a/file.txt");
  });

  test("should not allow moving folder into its descendant", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a/file.txt" },
    };

    applyReparentFolderToCollection(collection, "a", "a/b");

    expect(collection.a?.name).toBe("a/file.txt");
  });
});

describe("applyReparentEntityToCollection", () => {
  type Entity = { name: string };

  test("should move named entity to new folder", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a/file.txt" },
      b: { name: "other/file2.txt" },
    };

    applyReparentEntityToCollection(collection, "a", "x");

    expect(collection.a?.name).toBe("x/file.txt");
    expect(collection.b?.name).toBe("other/file2.txt");
  });

  test("should move named entity to deep folder", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a/file.txt" },
    };

    applyReparentEntityToCollection(collection, "a", "x/y/z");

    expect(collection.a?.name).toBe("x/y/z/file.txt");
  });

  test("should move named entity to root (empty path)", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a/file.txt" },
    };

    applyReparentEntityToCollection(collection, "a", "");

    expect(collection.a?.name).toBe("file.txt");
  });

  test("should normalize during reparenting", () => {
    const collection: Record<string, Entity> = {
      a: { name: "\\a//sub\\file.txt" },
    };

    applyReparentEntityToCollection(collection, "a", "\\x//y\\");

    expect(collection.a?.name).toBe("x/y/file.txt");
  });

  test("should handle unnamed entity (trailing slash)", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a/" },
    };

    applyReparentEntityToCollection(collection, "a", "x");

    expect(collection.a?.name).toBe("x/");
  });

  test("should handle unnamed entity moved to deep folder", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a/" },
    };

    applyReparentEntityToCollection(collection, "a", "x/y");

    expect(collection.a?.name).toBe("x/y/");
  });

  test("should handle unnamed entity moved to root", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a/" },
    };

    applyReparentEntityToCollection(collection, "a", "");

    expect(collection.a?.name).toBe("");
  });

  test("should do nothing if id does not exist", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a/file.txt" },
    };

    applyReparentEntityToCollection(collection, "missing", "x");

    expect(collection.a?.name).toBe("a/file.txt");
  });

  test("should do nothing if entry is undefined", () => {
    const collection: Record<string, Entity | undefined> = {
      a: undefined,
    };

    applyReparentEntityToCollection(collection, "a", "x");

    expect(collection.a).toBeUndefined();
  });

  test("should only affect the specified id", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a/file.txt" },
      b: { name: "b/file.txt" },
    };

    applyReparentEntityToCollection(collection, "a", "x");

    expect(collection.a?.name).toBe("x/file.txt");
    expect(collection.b?.name).toBe("b/file.txt");
  });
});

describe("pruneMissingEntities", () => {
  test("preserves undefined values from arrays when no schema is provided", () => {
    expect(pruneMissingEntities([1, undefined, 2, undefined, 3])).toEqual([
      1,
      undefined,
      2,
      undefined,
      3,
    ]);
  });

  test("preserves undefined values from nested arrays when no schema is provided", () => {
    expect(pruneMissingEntities([1, [undefined, 2], undefined, [3]])).toEqual([
      1,
      [undefined, 2],
      undefined,
      [3],
    ]);
  });

  test("removes undefined and null values from arrays when schema disallows missing entity references", () => {
    const itemSchema = new schema.Entity("items");

    expect(
      pruneMissingEntities(
        [undefined, null, { id: "item1" }, { id: "item2" }],
        [itemSchema],
      ),
    ).toEqual([{ id: "item1" }, { id: "item2" }]);
  });

  test("removes undefined and null values from nested arrays when nested schema disallows missing entity references", () => {
    const frameSchema = new schema.Entity("frames");
    const animationSchema = new schema.Entity("animations", {
      frames: [frameSchema],
    });
    const stateSchema = new schema.Entity("states", {
      animations: [animationSchema],
    });
    const spriteSchema = new schema.Entity("sprites", {
      states: [stateSchema],
    });

    expect(
      pruneMissingEntities(
        {
          id: "sprite1",
          states: [
            undefined,
            null,
            {
              id: "state1",
              animations: [
                undefined,
                null,
                {
                  id: "anim1",
                  frames: [undefined, null, { id: "frame1", tiles: [] }],
                },
              ],
            },
          ],
        },
        spriteSchema,
      ),
    ).toEqual({
      id: "sprite1",
      states: [
        {
          id: "state1",
          animations: [
            {
              id: "anim1",
              frames: [{ id: "frame1", tiles: [] }],
            },
          ],
        },
      ],
    });
  });

  test("preserves null and undefined values in arrays when the schema does not define that field", () => {
    const spriteSchema = new schema.Entity("sprites");

    expect(
      pruneMissingEntities(
        {
          id: "sprite1",
          nullableValues: [null, undefined, "my-id"],
        },
        spriteSchema,
      ),
    ).toEqual({
      id: "sprite1",
      nullableValues: [null, undefined, "my-id"],
    });
  });

  test("preserves null and undefined values in arrays when no schema is provided for that field", () => {
    const stateSchema = new schema.Entity("states");
    const spriteSchema = new schema.Entity("sprites", {
      states: [stateSchema],
    });

    expect(
      pruneMissingEntities(
        {
          id: "sprite1",
          states: [{ id: "state1" }],
          nullableValues: [null, undefined, "my-id"],
        },
        spriteSchema,
      ),
    ).toEqual({
      id: "sprite1",
      states: [{ id: "state1" }],
      nullableValues: [null, undefined, "my-id"],
    });
  });

  test("prunes only fields defined in a plain object schema", () => {
    const itemSchema = new schema.Entity("items");

    expect(
      pruneMissingEntities(
        {
          items: [undefined, null, { id: "item1" }],
          values: [null, undefined, "keep-me"],
        },
        {
          items: [itemSchema],
        },
      ),
    ).toEqual({
      items: [{ id: "item1" }],
      values: [null, undefined, "keep-me"],
    });
  });

  test("preserves undefined object properties", () => {
    const itemSchema = new schema.Entity("items");

    expect(
      pruneMissingEntities(
        {
          id: "sprite1",
          notes: undefined,
        },
        itemSchema,
      ),
    ).toEqual({
      id: "sprite1",
      notes: undefined,
    });
  });

  test("preserves null object properties", () => {
    const itemSchema = new schema.Entity("items");

    expect(
      pruneMissingEntities(
        {
          id: "sprite1",
          value: null,
        },
        itemSchema,
      ),
    ).toEqual({
      id: "sprite1",
      value: null,
    });
  });

  test("preserves null and undefined values in data arrays while pruning missing entity arrays in the same object", () => {
    const stateSchema = new schema.Entity("states");
    const spriteSchema = new schema.Entity("sprites", {
      states: [stateSchema],
    });

    expect(
      pruneMissingEntities(
        {
          id: "sprite1",
          states: [undefined, null, { id: "state1" }],
          items: [null, undefined, { value: null }],
        },
        spriteSchema,
      ),
    ).toEqual({
      id: "sprite1",
      states: [{ id: "state1" }],
      items: [null, undefined, { value: null }],
    });
  });

  test("removes undefined and null values from Values schema arrays", () => {
    const scriptEventSchema = new schema.Entity("scriptEvents");
    scriptEventSchema.define({
      children: new schema.Values([scriptEventSchema]),
    });

    expect(
      pruneMissingEntities(
        {
          id: "event1",
          command: "EVENT_IF_TRUE",
          children: {
            true: [undefined, null, { id: "child1", command: "EVENT_END" }],
            false: undefined,
          },
        },
        scriptEventSchema,
      ),
    ).toEqual({
      id: "event1",
      command: "EVENT_IF_TRUE",
      children: {
        true: [{ id: "child1", command: "EVENT_END" }],
        false: undefined,
      },
    });
  });

  test("denormalizeEntities prunes missing script event children while preserving undefined child branches", () => {
    const state: EntitiesState = cloneDeep(initialEntitiesState);
    state.customEvents = {
      ids: ["script1"],
      entities: {
        script1: {
          id: "script1",
          name: "Script 1",
          symbol: "symbol",
          description: "Description",
          variables: {
            var1: { id: "var1", name: "Variable 1", passByReference: false },
          },
          actors: { actor1: { id: "actor1", name: "Actor 1" } },
          script: ["event1"],
        },
      },
    };
    state.scriptEvents = {
      ids: ["event1"],
      entities: {
        event1: {
          id: "event1",
          command: "EVENT_IF_TRUE",
          children: {
            true: ["event2"],
          },
        },
      },
    };

    expect(denormalizeEntities(state).scripts[0]?.script).toEqual([
      {
        id: "event1",
        command: "EVENT_IF_TRUE",
        children: {
          true: [],
          false: undefined,
        },
      },
    ]);
  });

  test("denormalizeEntities doesn't prune if all children are present", () => {
    const state: EntitiesState = cloneDeep(initialEntitiesState);
    state.customEvents = {
      ids: ["script1"],
      entities: {
        script1: {
          id: "script1",
          name: "Script 1",
          symbol: "symbol",
          description: "Description",
          variables: {
            var1: { id: "var1", name: "Variable 1", passByReference: false },
          },
          actors: { actor1: { id: "actor1", name: "Actor 1" } },
          script: ["event1"],
        },
      },
    };
    state.scriptEvents = {
      ids: ["event1", "event2"],
      entities: {
        event1: {
          id: "event1",
          command: "EVENT_IF_TRUE",
          children: {
            true: ["event2"],
          },
        },
        event2: {
          id: "event2",
          command: "EVENT_END",
          args: {},
        },
      },
    };

    expect(denormalizeEntities(state).scripts[0]?.script).toEqual([
      {
        id: "event1",
        command: "EVENT_IF_TRUE",
        children: {
          true: [
            {
              id: "event2",
              command: "EVENT_END",
              args: {},
            },
          ],
          false: undefined,
        },
      },
    ]);
  });

  test("does not traverse or clone fields not defined in the schema", () => {
    const stateSchema = new schema.Entity("states");
    const spriteSchema = new schema.Entity("sprites", {
      states: [stateSchema],
    });

    const unschemaData = {
      nullableValues: [null, undefined, "keep-me"],
      nested: {
        expensiveArray: [1, 2, 3],
      },
    };

    const input = {
      id: "sprite1",
      states: [{ id: "state1" }],
      unschemaData,
    };

    const result = pruneMissingEntities(input, spriteSchema);

    expect(result).toEqual(input);
    expect(result.unschemaData).toBe(unschemaData);
    expect(result.unschemaData.nested).toBe(unschemaData.nested);
    expect(result.unschemaData.nested.expensiveArray).toBe(
      unschemaData.nested.expensiveArray,
    );
  });

  test("preserves schema-defined array identity when no pruning is needed", () => {
    const stateSchema = new schema.Entity("states");
    const spriteSchema = new schema.Entity("sprites", {
      states: [stateSchema],
    });

    const states = [{ id: "state1" }, { id: "state2" }];
    const input = {
      id: "sprite1",
      states,
    };

    const result = pruneMissingEntities(input, spriteSchema);

    expect(result).toEqual(input);
    expect(result).toBe(input);
    expect(result.states).toBe(states);
  });

  test("clones only the schema-defined path that changed", () => {
    const stateSchema = new schema.Entity("states");
    const spriteSchema = new schema.Entity("sprites", {
      states: [stateSchema],
    });

    const metadata = {
      expensiveArray: [1, 2, 3],
    };

    const states = [undefined, { id: "state1" }];
    const input = {
      id: "sprite1",
      states,
      metadata,
    };

    const result = pruneMissingEntities(input, spriteSchema);

    expect(result).toEqual({
      id: "sprite1",
      states: [{ id: "state1" }],
      metadata,
    });

    expect(result).not.toBe(input);
    expect(result.states).not.toBe(states);
    expect(result.metadata).toBe(metadata);
  });

  test("plain object schema does not traverse unrelated fields", () => {
    const itemSchema = new schema.Entity("items");

    const values = [null, undefined, "keep-me"];
    const unrelated = {
      deep: {
        values,
      },
    };

    const input = {
      items: [{ id: "item1" }],
      unrelated,
    };

    const result = pruneMissingEntities(input, {
      items: [itemSchema],
    });

    expect(result).toBe(input);
    expect(result.unrelated).toBe(unrelated);
    expect(result.unrelated.deep.values).toBe(values);
  });

  test("preserves Values schema object identity when no pruning is needed", () => {
    const scriptEventSchema = new schema.Entity("scriptEvents");
    scriptEventSchema.define({
      children: new schema.Values([scriptEventSchema]),
    });

    const trueBranch = [{ id: "child1", command: "EVENT_END" }];
    const children = {
      true: trueBranch,
      false: [],
    };

    const input = {
      id: "event1",
      command: "EVENT_IF_TRUE",
      children,
    };

    const result = pruneMissingEntities(input, scriptEventSchema);

    expect(result).toBe(input);
    expect(result.children).toBe(children);
    expect(result.children.true).toBe(trueBranch);
  });

  test("Values schema clones only branches that need pruning", () => {
    const scriptEventSchema = new schema.Entity("scriptEvents");
    scriptEventSchema.define({
      children: new schema.Values([scriptEventSchema]),
    });

    const falseBranch = [{ id: "child2", command: "EVENT_END" }];
    const children = {
      true: [undefined, { id: "child1", command: "EVENT_END" }],
      false: falseBranch,
    };

    const input = {
      id: "event1",
      command: "EVENT_IF_TRUE",
      children,
    };

    const result = pruneMissingEntities(input, scriptEventSchema);

    expect(result).toEqual({
      id: "event1",
      command: "EVENT_IF_TRUE",
      children: {
        true: [{ id: "child1", command: "EVENT_END" }],
        false: falseBranch,
      },
    });

    expect(result).not.toBe(input);
    expect(result.children).not.toBe(children);
    expect(result.children.false).toBe(falseBranch);
  });

  test("does not access items inside large arrays when the field is not schema-defined", () => {
    const itemSchema = new schema.Entity("items");

    const dangerousItem = {};
    Object.defineProperty(dangerousItem, "value", {
      get() {
        throw new Error("Should not be read");
      },
    });

    const input = {
      items: [{ id: "item1" }],
      tileData: [dangerousItem],
    };

    expect(() =>
      pruneMissingEntities(input, {
        items: [itemSchema],
      }),
    ).not.toThrow();
  });
});
