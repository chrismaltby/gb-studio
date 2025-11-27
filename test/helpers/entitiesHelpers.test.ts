import { EntityState } from "@reduxjs/toolkit";
import {
  isActorPrefabEqual,
  isTriggerPrefabEqual,
  ensureEntitySymbolsUnique,
  getMetaspriteTilesForSpriteSheet,
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
