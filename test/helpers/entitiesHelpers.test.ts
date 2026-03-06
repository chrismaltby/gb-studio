import { EntityState } from "@reduxjs/toolkit";
import {
  isActorPrefabEqual,
  isTriggerPrefabEqual,
  ensureEntitySymbolsUnique,
  getMetaspriteTilesForSpriteSheet,
  nextIndexedName,
  applyReparentFolderToCollection,
  applyReparentEntityToCollection,
} from "shared/lib/entities/entitiesHelpers";
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
    expect(state.entities.e1.symbol).toBe("entity");
    expect(state.entities.e2.symbol).toBe("entity_0");
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
    expect(state.entities.e1.symbol).toBe("entity1");
    expect(state.entities.e2.symbol).toBe("entity2");
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
    expect(state.entities.e1.symbol).toBe("symbol");
    expect(state.entities.e2.symbol).toBe("symbol_0");
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
    expect(state.entities.e1.symbol).toBe("symbol");
    expect(state.entities.e2.symbol).toBe("symbol_0");
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

describe("applyReparentFolderToCollection", () => {
  type Entity = { name: string };

  test("should not allow moving a single file path", () => {
    const collection: Record<string, Entity> = {
      a: { name: "folder/file.txt" },
      b: { name: "folder/other.txt" },
    };

    applyReparentFolderToCollection(collection, "folder/file.txt", "newFolder");

    expect(collection.a.name).toBe("folder/file.txt");
    expect(collection.b.name).toBe("folder/other.txt");
  });

  test("should move all files within folder", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a" },
      b: { name: "a/file.txt" },
      c: { name: "a/sub/file2.txt" },
      d: { name: "other/file3.txt" },
    };

    applyReparentFolderToCollection(collection, "a", "x");

    expect(collection.a.name).toBe("a");
    expect(collection.b.name).toBe("x/a/file.txt");
    expect(collection.c.name).toBe("x/a/sub/file2.txt");
    expect(collection.d.name).toBe("other/file3.txt");
  });

  test("should move nested folder and its contents correctly", () => {
    const collection: Record<string, Entity> = {
      a: { name: "root/a" },
      b: { name: "root/a/file.txt" },
      c: { name: "root/a/sub/file2.txt" },
    };

    applyReparentFolderToCollection(collection, "root/a", "x/y");

    expect(collection.a.name).toBe("root/a");
    expect(collection.b.name).toBe("x/y/a/file.txt");
    expect(collection.c.name).toBe("x/y/a/sub/file2.txt");
  });

  test("should allow moving folder to root", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a" },
      b: { name: "a/file.txt" },
    };

    applyReparentFolderToCollection(collection, "a", "");

    expect(collection.a.name).toBe("a");
    expect(collection.b.name).toBe("a/file.txt");
  });

  test("should do nothing if draggedPath does not match anything", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a/file.txt" },
      b: { name: "b/file.txt" },
    };

    applyReparentFolderToCollection(collection, "x", "y");

    expect(collection.a.name).toBe("a/file.txt");
    expect(collection.b.name).toBe("b/file.txt");
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

    expect(collection.a.name).toBe("x/a/file.txt");
  });

  test("should not partially match similar prefixes", () => {
    const collection: Record<string, Entity> = {
      a: { name: "folderA/file.txt" },
    };

    applyReparentFolderToCollection(collection, "folder", "x");

    expect(collection.a.name).toBe("folderA/file.txt");
  });

  test("should not allow moving folder into itself", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a/file.txt" },
    };

    applyReparentFolderToCollection(collection, "a", "a");

    expect(collection.a.name).toBe("a/file.txt");
  });

  test("should not allow moving folder into its descendant", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a/file.txt" },
    };

    applyReparentFolderToCollection(collection, "a", "a/b");

    expect(collection.a.name).toBe("a/file.txt");
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

    expect(collection.a.name).toBe("x/file.txt");
    expect(collection.b.name).toBe("other/file2.txt");
  });

  test("should move named entity to deep folder", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a/file.txt" },
    };

    applyReparentEntityToCollection(collection, "a", "x/y/z");

    expect(collection.a.name).toBe("x/y/z/file.txt");
  });

  test("should move named entity to root (empty path)", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a/file.txt" },
    };

    applyReparentEntityToCollection(collection, "a", "");

    expect(collection.a.name).toBe("file.txt");
  });

  test("should normalize during reparenting", () => {
    const collection: Record<string, Entity> = {
      a: { name: "\\a//sub\\file.txt" },
    };

    applyReparentEntityToCollection(collection, "a", "\\x//y\\");

    expect(collection.a.name).toBe("x/y/file.txt");
  });

  test("should handle unnamed entity (trailing slash)", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a/" },
    };

    applyReparentEntityToCollection(collection, "a", "x");

    expect(collection.a.name).toBe("x/");
  });

  test("should handle unnamed entity moved to deep folder", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a/" },
    };

    applyReparentEntityToCollection(collection, "a", "x/y");

    expect(collection.a.name).toBe("x/y/");
  });

  test("should handle unnamed entity moved to root", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a/" },
    };

    applyReparentEntityToCollection(collection, "a", "");

    expect(collection.a.name).toBe("");
  });

  test("should do nothing if id does not exist", () => {
    const collection: Record<string, Entity> = {
      a: { name: "a/file.txt" },
    };

    applyReparentEntityToCollection(collection, "missing", "x");

    expect(collection.a.name).toBe("a/file.txt");
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

    expect(collection.a.name).toBe("x/file.txt");
    expect(collection.b.name).toBe("b/file.txt");
  });
});
