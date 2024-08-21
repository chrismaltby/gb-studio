import { applyPrefabs } from "lib/compiler/applyPrefabs";
import { ScriptEvent } from "shared/lib/entities/entitiesTypes";
import {
  ActorResource,
  ActorPrefabResource,
  ProjectResources,
  TriggerResource,
  TriggerPrefabResource,
} from "shared/lib/resources/types";
import {
  dummyActorPrefabResource,
  dummyActorResource,
  dummyProjectResources,
  dummySceneResource,
  dummyTriggerPrefabResource,
  dummyTriggerResource,
} from "../../dummydata";

describe("applyPrefabs", () => {
  it("should apply actor prefabs correctly", () => {
    const actor: ActorResource = {
      ...dummyActorResource,
      id: "actor1",
      prefabId: "prefab1",
      script: [],
      prefabScriptOverrides: {
        "0": { id: "0", args: { x: 10 } },
      },
    };

    const actorPrefab: ActorPrefabResource = {
      ...dummyActorPrefabResource,
      id: "prefab1",
      script: [{ id: "0", command: "move", args: { x: 5 } }] as ScriptEvent[],
    };

    const projectData: ProjectResources = {
      ...dummyProjectResources,
      actorPrefabs: [actorPrefab],
      scenes: [
        {
          ...dummySceneResource,
          actors: [actor],
          triggers: [],
        },
      ],
    };

    const result = applyPrefabs(projectData);

    expect(result.scenes[0].actors[0].script[0].args?.x).toBe(10);
  });

  it("should apply trigger prefabs correctly", () => {
    const trigger: TriggerResource = {
      ...dummyTriggerResource,
      id: "trigger1",
      prefabId: "prefab1",
      script: [],
      prefabScriptOverrides: {
        "1": { id: "1", args: { y: 8 } },
      },
    };

    const triggerPrefab: TriggerPrefabResource = {
      ...dummyTriggerPrefabResource,
      id: "prefab1",
      script: [
        { id: "1", command: "trigger", args: { y: 3 } },
      ] as ScriptEvent[],
    };

    const projectData: ProjectResources = {
      ...dummyProjectResources,
      triggerPrefabs: [triggerPrefab],
      scenes: [
        {
          ...dummySceneResource,
          actors: [],
          triggers: [trigger],
        },
      ],
    };

    const result = applyPrefabs(projectData);

    expect(result.scenes[0].triggers[0].script[0].args?.y).toBe(8);
  });

  it("should return the original actor when no actor prefab is found", () => {
    const actor: ActorResource = {
      ...dummyActorResource,
      id: "actor1",
      prefabId: "nonExistentPrefab",
    };

    const projectData: ProjectResources = {
      ...dummyProjectResources,
      actorPrefabs: [],
      scenes: [
        {
          ...dummySceneResource,
          actors: [actor],
          triggers: [],
        },
      ],
    };

    const result = applyPrefabs(projectData);

    expect(result.scenes[0].actors[0]).toEqual(actor);
  });

  it("should return the original trigger when no trigger prefab is found", () => {
    const trigger: TriggerResource = {
      ...dummyTriggerResource,
      id: "trigger1",
      prefabId: "nonExistentPrefab",
    };

    const projectData: ProjectResources = {
      ...dummyProjectResources,
      triggerPrefabs: [],
      scenes: [
        {
          ...dummySceneResource,
          actors: [],
          triggers: [trigger],
        },
      ],
    };

    const result = applyPrefabs(projectData);

    expect(result.scenes[0].triggers[0]).toEqual(trigger);
  });

  it("should not modify actors or triggers without prefabs", () => {
    const actor: ActorResource = {
      ...dummyActorResource,
      id: "actor1",
      prefabId: "",
    };

    const trigger: TriggerResource = {
      ...dummyTriggerResource,
      id: "trigger1",
      prefabId: "",
    };

    const projectData: ProjectResources = {
      ...dummyProjectResources,
      scenes: [
        {
          ...dummySceneResource,
          actors: [actor],
          triggers: [trigger],
        },
      ],
    };

    const result = applyPrefabs(projectData);

    expect(result.scenes[0].actors[0]).toEqual(actor);
    expect(result.scenes[0].triggers[0]).toEqual(trigger);
  });

  it("should apply actor prefab without script overrides", () => {
    const actor: ActorResource = {
      ...dummyActorResource,
      id: "actor1",
      prefabId: "prefab1",
      script: [],
      prefabScriptOverrides: {},
    };

    const actorPrefab: ActorPrefabResource = {
      ...dummyActorPrefabResource,
      id: "prefab1",
      script: [{ id: "0", command: "move", args: { x: 5 } }] as ScriptEvent[],
    };

    const projectData: ProjectResources = {
      ...dummyProjectResources,
      actorPrefabs: [actorPrefab],
      scenes: [
        {
          ...dummySceneResource,
          actors: [actor],
          triggers: [],
        },
      ],
    };

    const result = applyPrefabs(projectData);

    expect(result.scenes[0].actors[0].script[0].args?.x).toBe(5);
  });

  it("should apply trigger prefab without script overrides", () => {
    const trigger: TriggerResource = {
      ...dummyTriggerResource,
      id: "trigger1",
      prefabId: "prefab1",
      script: [],
      prefabScriptOverrides: {},
    };

    const triggerPrefab: TriggerPrefabResource = {
      ...dummyTriggerPrefabResource,
      id: "prefab1",
      script: [
        { id: "1", command: "trigger", args: { y: 3 } },
      ] as ScriptEvent[],
    };

    const projectData: ProjectResources = {
      ...dummyProjectResources,
      triggerPrefabs: [triggerPrefab],
      scenes: [
        {
          ...dummySceneResource,
          actors: [],
          triggers: [trigger],
        },
      ],
    };

    const result = applyPrefabs(projectData);

    expect(result.scenes[0].triggers[0].script[0].args?.y).toBe(3);
  });
});
