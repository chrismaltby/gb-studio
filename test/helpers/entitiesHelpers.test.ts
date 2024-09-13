import {
  isActorPrefabEqual,
  isTriggerPrefabEqual,
} from "shared/lib/entities/entitiesHelpers";
import {
  ActorPrefabNormalized,
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
