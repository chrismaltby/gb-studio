import {
  Actor,
  ActorNormalized,
  CustomEvent,
  CustomEventNormalized,
  SceneNormalized,
  ScriptEvent,
  ScriptEventNormalized,
  Trigger,
  TriggerNormalized,
} from "shared/lib/entities/entitiesTypes";
import {
  mapActorScript,
  mapTriggerScript,
  walkNormalizedActorScripts,
  walkNormalizedSceneSpecificScripts,
  walkNormalizedScenesScripts,
  walkNormalizedScript,
  walkNormalizedTriggerScripts,
  walkScript,
} from "../../src/shared/lib/scripts/walk";
import {
  dummyActor,
  dummyActorNormalized,
  dummyActorPrefabNormalized,
  dummySceneNormalized,
  dummyScriptEvent,
  dummyScriptEventNormalized,
  dummyTrigger,
  dummyTriggerNormalized,
  dummyTriggerPrefabNormalized,
} from "../dummydata";

test("shouldn't walk empty events", () => {
  const events: ScriptEvent[] = [];
  const myMock = jest.fn();
  walkScript(events, undefined, myMock);
  expect(myMock.mock.calls.length).toBe(0);
});

test("shouldn't walk undefined events", () => {
  const myMock = jest.fn();
  walkScript(undefined, undefined, myMock);
  expect(myMock.mock.calls.length).toBe(0);
});

test("should walk each node once", () => {
  const events = [
    {
      id: "0",
    },
    {
      id: "1",
    },
  ] as unknown as ScriptEvent[];
  const myMock = jest.fn();
  walkScript(events, undefined, myMock);
  expect(myMock.mock.calls.length).toBe(2);
});

test("should walk each node once", () => {
  const events = [
    {
      id: "0",
    },
    {
      id: "1",
    },
  ] as unknown as ScriptEvent[];
  const myMock = jest.fn();
  walkScript(events, undefined, myMock);
  expect(myMock.mock.calls.length).toBe(2);
});

test("should walk each node in order", () => {
  const events = [
    {
      id: "0",
    },
    {
      id: "1",
    },
  ] as unknown as ScriptEvent[];
  const output: string[] = [];
  const myFn = (node: ScriptEvent) => output.push(node.id);
  walkScript(events, undefined, myFn);
  expect(output).toEqual(["0", "1"]);
});

test("should walk node, then true path, then false path", () => {
  const events = [
    {
      id: "0",
      children: {
        true: [
          {
            id: "1",
          },
          {
            id: "2",
          },
        ],
        false: [
          {
            id: "3",
          },
        ],
      },
    },
    {
      id: "4",
    },
  ] as unknown as ScriptEvent[];
  const output: string[] = [];
  const myFn = (node: ScriptEvent) => output.push(node.id);
  walkScript(events, undefined, myFn);
  expect(output).toEqual(["0", "1", "2", "3", "4"]);
});

test("shouldn't recursively walk through the same custom script multiple times", () => {
  const events = [
    {
      id: "0",
      command: "EVENT_CALL_CUSTOM_EVENT",
      args: {
        customEventId: "s1",
      },
    },
  ] as unknown as ScriptEvent[];
  const customEventsLookup = {
    s1: {
      id: "s1",
      script: [
        {
          id: "1",
        },
        {
          id: "2",
          command: "EVENT_CALL_CUSTOM_EVENT",
          args: {
            customEventId: "s1",
          },
        },
      ],
    },
  } as unknown as Record<string, CustomEvent>;
  const output: string[] = [];
  const myFn = (node: ScriptEvent) => output.push(node.id);
  walkScript(
    events,
    {
      customEvents: {
        lookup: customEventsLookup,
        maxDepth: 5,
      },
    },
    myFn
  );
  expect(output).toEqual(["0", "1", "2"]);
});

test("shouldn't walk through commented events", () => {
  const events = [
    {
      id: "0",
      args: {
        __comment: true,
      },
    },
    {
      id: "1",
    },
    {
      id: "2",
      args: {
        __comment: true,
      },
    },
  ] as unknown as ScriptEvent[];
  const output: string[] = [];
  const myFn = (node: ScriptEvent) => output.push(node.id);
  walkScript(events, undefined, myFn);
  expect(output).toEqual(["1"]);
});

test("shouldn't recursively walk through the same normalized custom script multiple times", () => {
  const eventIds = ["0"];
  const eventsLookup = {
    "0": {
      id: "0",
      command: "EVENT_CALL_CUSTOM_EVENT",
      args: {
        customEventId: "s1",
      },
    },
    "1": {
      id: "1",
    },
    "2": {
      id: "2",
      command: "EVENT_CALL_CUSTOM_EVENT",
      args: {
        customEventId: "s1",
      },
    },
  } as unknown as Record<string, ScriptEventNormalized>;
  const customEventsLookup = {
    s1: {
      id: "s1",
      script: ["1", "2"],
    },
  } as unknown as Record<string, CustomEventNormalized>;
  const output: string[] = [];
  const myFn = (node: ScriptEventNormalized) => output.push(node.id);
  walkNormalizedScript(
    eventIds,
    eventsLookup,
    {
      customEvents: {
        lookup: customEventsLookup,
        maxDepth: 5,
      },
    },
    myFn
  );
  expect(output).toEqual(["0", "1", "2"]);
});

test("shouldn't walk through commented normalized events", () => {
  const eventIds = ["0", "1", "2"];
  const eventsLookup = {
    "0": {
      id: "0",
      args: {
        __comment: true,
      },
    },
    "1": {
      id: "1",
    },
    "2": {
      id: "2",
      args: {
        __comment: true,
      },
    },
  } as unknown as Record<string, ScriptEventNormalized>;
  const output: string[] = [];
  const myFn = (node: ScriptEventNormalized) => output.push(node.id);
  walkNormalizedScript(eventIds, eventsLookup, undefined, myFn);
  expect(output).toEqual(["1"]);
});

test("should walk through commented normalized events if requested", () => {
  const eventIds = ["0", "1", "2"];
  const eventsLookup = {
    "0": {
      id: "0",
      args: {
        __comment: true,
      },
    },
    "1": {
      id: "1",
    },
    "2": {
      id: "2",
      args: {
        __comment: true,
      },
    },
  } as unknown as Record<string, ScriptEventNormalized>;
  const output: string[] = [];
  const myFn = (node: ScriptEventNormalized) => output.push(node.id);
  walkNormalizedScript(
    eventIds,
    eventsLookup,
    {
      includeCommented: true,
    },
    myFn
  );
  expect(output).toEqual(["0", "1", "2"]);
});

test("should visit normalized custom script multiple times when called at same level", () => {
  const eventIds = ["0", "2"];
  const eventsLookup = {
    "0": {
      id: "0",
      command: "EVENT_CALL_CUSTOM_EVENT",
      args: {
        customEventId: "s1",
      },
    },
    "1": {
      id: "1",
    },
    "2": {
      id: "2",
      command: "EVENT_CALL_CUSTOM_EVENT",
      args: {
        customEventId: "s1",
      },
    },
  } as unknown as Record<string, ScriptEventNormalized>;
  const customEventsLookup = {
    s1: {
      id: "s1",
      script: ["1"],
    },
  } as unknown as Record<string, CustomEventNormalized>;
  const output: string[] = [];
  const myFn = (node: ScriptEventNormalized) => output.push(node.id);
  walkNormalizedScript(
    eventIds,
    eventsLookup,
    {
      customEvents: {
        lookup: customEventsLookup,
        maxDepth: 5,
      },
    },
    myFn
  );
  expect(output).toEqual(["0", "1", "2", "1"]);
});

test("should visit custom script multiple times when called at same level", () => {
  const events = [
    {
      id: "0",
      command: "EVENT_CALL_CUSTOM_EVENT",
      args: {
        customEventId: "s1",
      },
    },
    {
      id: "2",
      command: "EVENT_CALL_CUSTOM_EVENT",
      args: {
        customEventId: "s1",
      },
    },
  ] as unknown as ScriptEvent[];
  const customEventsLookup = {
    s1: {
      id: "s1",
      script: [
        {
          id: "1",
        },
      ],
    },
  } as unknown as Record<string, CustomEvent>;
  const output: string[] = [];
  const myFn = (node: ScriptEvent) => output.push(node.id);
  walkScript(
    events,
    {
      customEvents: {
        lookup: customEventsLookup,
        maxDepth: 5,
      },
    },
    myFn
  );
  expect(output).toEqual(["0", "1", "2", "1"]);
});

describe("walkNormalizedActorScripts", () => {
  // Test for walking scripts directly from an actor without a prefab
  test("should walk scripts directly from an actor without prefab", () => {
    const actor: ActorNormalized = {
      ...dummyActorNormalized,
      id: "actor1",
      name: "Actor 1",
      script: ["0"],
      startScript: ["1"],
    } as ActorNormalized;

    const eventsLookup = {
      "0": { ...dummyScriptEventNormalized, id: "0" },
      "1": { ...dummyScriptEventNormalized, id: "1" },
    };

    const prefabsLookup = {};
    const output: string[] = [];
    const myFn = (node: ScriptEventNormalized) => output.push(node.id);

    walkNormalizedActorScripts(
      actor,
      eventsLookup,
      prefabsLookup,
      undefined,
      myFn
    );

    expect(output).toEqual(["0", "1"]);
  });

  // Test for walking scripts using a prefab
  test("should walk scripts from actor's prefab when available", () => {
    const actor: ActorNormalized = {
      ...dummyActorNormalized,
      id: "actor1",
      name: "Actor 1",
      prefabId: "prefab1",
      script: [],
      startScript: [],
    } as ActorNormalized;

    const prefabsLookup = {
      prefab1: {
        ...dummyActorPrefabNormalized,
        id: "prefab1",
        script: ["0"],
        startScript: ["1"],
      },
    };

    const eventsLookup = {
      "0": { ...dummyScriptEventNormalized, id: "0" },
      "1": { ...dummyScriptEventNormalized, id: "1" },
    };

    const output: string[] = [];
    const myFn = (node: ScriptEventNormalized) => output.push(node.id);

    walkNormalizedActorScripts(
      actor,
      eventsLookup,
      prefabsLookup,
      undefined,
      myFn
    );

    expect(output).toEqual(["0", "1"]);
  });

  // Test for walking scripts with overrides in actor's prefabScriptOverrides
  test("should walk scripts from actor's prefab and apply script overrides", () => {
    const actor: ActorNormalized = {
      ...dummyActorNormalized,
      id: "actor1",
      name: "Actor 1",
      prefabId: "prefab1",
      prefabScriptOverrides: {
        "0": {
          id: "0",
          args: { overridden: true },
        },
      },
      script: [],
      startScript: [],
    } as ActorNormalized;

    const prefabsLookup = {
      prefab1: {
        ...dummyActorPrefabNormalized,
        id: "prefab1",
        script: ["0"],
        startScript: ["1"],
      },
    };

    const eventsLookup = {
      "0": { ...dummyScriptEventNormalized, id: "0", args: {} },
      "1": { ...dummyScriptEventNormalized, id: "1" },
    };

    const output: ScriptEventNormalized[] = [];
    const myFn = (node: ScriptEventNormalized) => output.push(node);

    walkNormalizedActorScripts(
      actor,
      eventsLookup,
      prefabsLookup,
      undefined,
      myFn
    );

    expect(output).toEqual([
      { ...dummyScriptEventNormalized, id: "0", args: { overridden: true } },
      { ...dummyScriptEventNormalized, id: "1" },
    ]);
  });

  // Test for walking scripts when actor has a prefab but with missing scripts in the lookup
  test("should skip missing scripts in prefab's lookup", () => {
    const actor: ActorNormalized = {
      ...dummyActorNormalized,
      id: "actor1",
      name: "Actor 1",
      prefabId: "prefab1",
      script: [],
      startScript: [],
    } as ActorNormalized;

    const prefabsLookup = {
      prefab1: {
        ...dummyActorPrefabNormalized,
        id: "prefab1",
        script: ["missing_script"],
        startScript: ["1"],
      },
    };

    const eventsLookup = {
      "1": { ...dummyScriptEventNormalized, id: "1" },
    };

    const output: string[] = [];
    const myFn = (node: ScriptEventNormalized) => output.push(node.id);

    walkNormalizedActorScripts(
      actor,
      eventsLookup,
      prefabsLookup,
      undefined,
      myFn
    );

    expect(output).toEqual(["1"]); // missing_script is not found in lookup so it should be skipped
  });

  // Test for walking scripts when actor has no prefab and no scripts
  test("should handle actor with no prefab and no scripts", () => {
    const actor: ActorNormalized = {
      ...dummyActorNormalized,
      id: "actor1",
      name: "Actor 1",
      prefabId: "",
      script: [],
      startScript: [],
    } as ActorNormalized;

    const eventsLookup = {};
    const prefabsLookup = {};

    const myFn = jest.fn();

    walkNormalizedActorScripts(
      actor,
      eventsLookup,
      prefabsLookup,
      undefined,
      myFn
    );

    expect(myFn.mock.calls.length).toBe(0);
  });
});

describe("walkNormalizedTriggerScripts", () => {
  // Test for walking scripts directly from a trigger without a prefab
  test("should walk scripts directly from a trigger without prefab", () => {
    const trigger: TriggerNormalized = {
      ...dummyTriggerNormalized,
      id: "trigger1",
      script: ["0"],
      leaveScript: ["1"],
    } as TriggerNormalized;

    const eventsLookup = {
      "0": { ...dummyScriptEventNormalized, id: "0" },
      "1": { ...dummyScriptEventNormalized, id: "1" },
    };

    const prefabsLookup = {};
    const output: string[] = [];
    const myFn = (node: ScriptEventNormalized) => output.push(node.id);

    walkNormalizedTriggerScripts(
      trigger,
      eventsLookup,
      prefabsLookup,
      undefined,
      myFn
    );

    expect(output).toEqual(["0", "1"]);
  });

  // Test for walking scripts using a prefab
  test("should walk scripts from trigger's prefab when available", () => {
    const trigger: TriggerNormalized = {
      ...dummyTriggerNormalized,
      id: "trigger1",
      prefabId: "prefab1",
      script: [],
      leaveScript: [],
    } as TriggerNormalized;

    const prefabsLookup = {
      prefab1: {
        ...dummyTriggerPrefabNormalized,
        id: "prefab1",
        script: ["0"],
        leaveScript: ["1"],
      },
    };

    const eventsLookup = {
      "0": { ...dummyScriptEventNormalized, id: "0" },
      "1": { ...dummyScriptEventNormalized, id: "1" },
    };

    const output: string[] = [];
    const myFn = (node: ScriptEventNormalized) => output.push(node.id);

    walkNormalizedTriggerScripts(
      trigger,
      eventsLookup,
      prefabsLookup,
      undefined,
      myFn
    );

    expect(output).toEqual(["0", "1"]);
  });

  // Test for walking scripts with overrides in trigger's prefabScriptOverrides
  test("should walk scripts from trigger's prefab and apply script overrides", () => {
    const trigger: TriggerNormalized = {
      ...dummyTriggerNormalized,
      id: "trigger1",
      prefabId: "prefab1",
      prefabScriptOverrides: {
        "0": {
          id: "0",
          args: { overridden: true },
        },
      },
      script: [],
      leaveScript: [],
    } as TriggerNormalized;

    const prefabsLookup = {
      prefab1: {
        ...dummyTriggerPrefabNormalized,
        id: "prefab1",
        script: ["0"],
        leaveScript: ["1"],
      },
    };

    const eventsLookup = {
      "0": { ...dummyScriptEventNormalized, id: "0", args: {} },
      "1": { ...dummyScriptEventNormalized, id: "1" },
    };

    const output: ScriptEventNormalized[] = [];
    const myFn = (node: ScriptEventNormalized) => output.push(node);

    walkNormalizedTriggerScripts(
      trigger,
      eventsLookup,
      prefabsLookup,
      undefined,
      myFn
    );

    expect(output).toEqual([
      { ...dummyScriptEventNormalized, id: "0", args: { overridden: true } },
      { ...dummyScriptEventNormalized, id: "1" },
    ]);
  });

  // Test for walking scripts when trigger has a prefab but with missing scripts in the lookup
  test("should skip missing scripts in prefab's lookup", () => {
    const trigger: TriggerNormalized = {
      ...dummyTriggerNormalized,
      id: "trigger1",
      prefabId: "prefab1",
      script: [],
      leaveScript: [],
    } as TriggerNormalized;

    const prefabsLookup = {
      prefab1: {
        ...dummyTriggerPrefabNormalized,
        id: "prefab1",
        script: ["missing_script"],
        leaveScript: ["1"],
      },
    };

    const eventsLookup = {
      "1": { ...dummyScriptEventNormalized, id: "1" },
    };

    const output: string[] = [];
    const myFn = (node: ScriptEventNormalized) => output.push(node.id);

    walkNormalizedTriggerScripts(
      trigger,
      eventsLookup,
      prefabsLookup,
      undefined,
      myFn
    );

    expect(output).toEqual(["1"]); // missing_script is not found in lookup so it should be skipped
  });

  // Test for walking scripts when trigger has no prefab and no scripts
  test("should handle trigger with no prefab and no scripts", () => {
    const trigger: TriggerNormalized = {
      ...dummyTriggerNormalized,
      id: "trigger1",
      prefabId: "",
      script: [],
      leaveScript: [],
    } as TriggerNormalized;

    const eventsLookup = {};
    const prefabsLookup = {};

    const myFn = jest.fn();

    walkNormalizedTriggerScripts(
      trigger,
      eventsLookup,
      prefabsLookup,
      undefined,
      myFn
    );

    expect(myFn.mock.calls.length).toBe(0);
  });
});

describe("walkNormalizedSceneSpecificScripts", () => {
  // Test for walking all scripts in a scene without actors or triggers
  test("should walk all specific scripts in a scene without actors or triggers", () => {
    const scene = {
      ...dummySceneNormalized,
      id: "scene1",
      script: ["0"],
      playerHit1Script: ["1"],
      playerHit2Script: ["2"],
      playerHit3Script: ["3"],
    } as SceneNormalized;

    const eventsLookup = {
      "0": { ...dummyScriptEventNormalized, id: "0" },
      "1": { ...dummyScriptEventNormalized, id: "1" },
      "2": { ...dummyScriptEventNormalized, id: "2" },
      "3": { ...dummyScriptEventNormalized, id: "3" },
    };

    const output: string[] = [];
    const myFn = (node: ScriptEventNormalized) => output.push(node.id);

    walkNormalizedSceneSpecificScripts(scene, eventsLookup, undefined, myFn);

    expect(output).toEqual(["0", "1", "2", "3"]);
  });

  // Test for walking specific scripts in a scene with a filter applied
  test("should walk specific scripts in a scene with a filter applied", () => {
    const scene = {
      ...dummySceneNormalized,
      id: "scene1",
      script: ["0"],
      playerHit1Script: ["1"],
      playerHit2Script: ["2"],
      playerHit3Script: ["3"],
    } as SceneNormalized;

    const eventsLookup = {
      "0": { ...dummyScriptEventNormalized, id: "0" },
      "1": { ...dummyScriptEventNormalized, id: "1" },
      "2": { ...dummyScriptEventNormalized, id: "2" },
      "3": { ...dummyScriptEventNormalized, id: "3" },
    };

    const output: string[] = [];
    const myFn = (node: ScriptEventNormalized) => output.push(node.id);

    walkNormalizedSceneSpecificScripts(
      scene,
      eventsLookup,
      { filter: (e) => e.id !== "2" },
      myFn
    );

    expect(output).toEqual(["0", "1", "3"]);
  });

  // Test for handling a scene with missing scripts in the lookup
  test("should skip missing scripts in the scene's lookup", () => {
    const scene = {
      ...dummySceneNormalized,
      id: "scene1",
      script: ["0"],
      playerHit1Script: ["1"],
      playerHit2Script: ["missing_script"],
      playerHit3Script: ["3"],
    } as SceneNormalized;

    const eventsLookup = {
      "0": { ...dummyScriptEventNormalized, id: "0" },
      "1": { ...dummyScriptEventNormalized, id: "1" },
      "3": { ...dummyScriptEventNormalized, id: "3" },
    };

    const output: string[] = [];
    const myFn = (node: ScriptEventNormalized) => output.push(node.id);

    walkNormalizedSceneSpecificScripts(scene, eventsLookup, undefined, myFn);

    expect(output).toEqual(["0", "1", "3"]); // "missing_script" is skipped
  });

  // Test for walking specific scripts with a custom callback
  test("should correctly apply a custom callback to each script event", () => {
    const scene = {
      ...dummySceneNormalized,
      id: "scene1",
      script: ["0"],
      playerHit1Script: ["1"],
    } as SceneNormalized;

    const eventsLookup = {
      "0": { ...dummyScriptEventNormalized, id: "0", command: "COMMAND_A" },
      "1": { ...dummyScriptEventNormalized, id: "1", command: "COMMAND_B" },
    };

    const output: string[] = [];
    const myFn = (node: ScriptEventNormalized) =>
      output.push(`${node.command}-${node.id}`);

    walkNormalizedSceneSpecificScripts(scene, eventsLookup, undefined, myFn);

    expect(output).toEqual(["COMMAND_A-0", "COMMAND_B-1"]);
  });

  // Test for handling an empty scene with no scripts
  test("should handle an empty scene with no scripts", () => {
    const scene = {
      ...dummySceneNormalized,
      id: "scene1",
      script: [],
      playerHit1Script: [],
      playerHit2Script: [],
      playerHit3Script: [],
    } as SceneNormalized;

    const eventsLookup = {};

    const myFn = jest.fn();

    walkNormalizedSceneSpecificScripts(scene, eventsLookup, undefined, myFn);

    expect(myFn.mock.calls.length).toBe(0);
  });
});

describe("walkNormalizedScenesScripts", () => {
  // Test for walking all scripts in a set of scenes without actors or triggers
  test("should walk all scripts in scenes without actors or triggers", () => {
    const scenes = [
      {
        ...dummySceneNormalized,
        id: "scene1",
        script: ["0"],
        playerHit1Script: ["1"],
        playerHit2Script: ["2"],
        playerHit3Script: ["3"],
      },
      {
        ...dummySceneNormalized,
        id: "scene2",
        script: ["4"],
        playerHit1Script: ["5"],
        playerHit2Script: [],
        playerHit3Script: ["6"],
      },
    ] as SceneNormalized[];

    const eventsLookup = {
      "0": { ...dummyScriptEventNormalized, id: "0" },
      "1": { ...dummyScriptEventNormalized, id: "1" },
      "2": { ...dummyScriptEventNormalized, id: "2" },
      "3": { ...dummyScriptEventNormalized, id: "3" },
      "4": { ...dummyScriptEventNormalized, id: "4" },
      "5": { ...dummyScriptEventNormalized, id: "5" },
      "6": { ...dummyScriptEventNormalized, id: "6" },
    };

    const actorsLookup = {};
    const triggersLookup = {};
    const actorPrefabsLookup = {};
    const triggerPrefabsLookup = {};

    const output: string[] = [];
    const myFn = (node: ScriptEventNormalized) => output.push(node.id);

    walkNormalizedScenesScripts(
      scenes,
      eventsLookup,
      actorsLookup,
      triggersLookup,
      actorPrefabsLookup,
      triggerPrefabsLookup,
      undefined,
      myFn
    );

    expect(output).toEqual(["0", "1", "2", "3", "4", "5", "6"]);
  });

  // Test for walking scripts in scenes with actors
  test("should walk scripts in scenes with actors", () => {
    const scenes = [
      {
        ...dummySceneNormalized,
        id: "scene1",
        script: ["0"],
        actors: ["actor1"],
      },
    ] as SceneNormalized[];

    const eventsLookup = {
      "0": { ...dummyScriptEventNormalized, id: "0" },
      "1": { ...dummyScriptEventNormalized, id: "1" },
    };

    const actorsLookup = {
      actor1: {
        ...dummyActorNormalized,
        id: "actor1",
        script: ["1"],
        startScript: [],
        updateScript: [],
      },
    };
    const triggersLookup = {};
    const actorPrefabsLookup = {};
    const triggerPrefabsLookup = {};

    const output: string[] = [];

    walkNormalizedScenesScripts(
      scenes,
      eventsLookup,
      actorsLookup,
      triggersLookup,
      actorPrefabsLookup,
      triggerPrefabsLookup,
      undefined,
      (event, scene, actor) => {
        output.push(event.id);
        if (actor) {
          output.push(actor.id);
        }
      }
    );

    expect(output).toEqual(["0", "1", "actor1"]);
  });

  // Test for walking scripts in scenes with triggers
  test("should walk scripts in scenes with triggers", () => {
    const scenes = [
      {
        ...dummySceneNormalized,
        id: "scene1",
        script: ["0"],
        triggers: ["trigger1"],
      },
    ] as SceneNormalized[];

    const eventsLookup = {
      "0": { ...dummyScriptEventNormalized, id: "0" },
      "1": { ...dummyScriptEventNormalized, id: "1" },
    };

    const actorsLookup = {};
    const triggersLookup = {
      trigger1: {
        ...dummyTriggerNormalized,
        id: "trigger1",
        script: ["1"],
        leaveScript: [],
      },
    };
    const actorPrefabsLookup = {};
    const triggerPrefabsLookup = {};

    const output: string[] = [];

    walkNormalizedScenesScripts(
      scenes,
      eventsLookup,
      actorsLookup,
      triggersLookup,
      actorPrefabsLookup,
      triggerPrefabsLookup,
      undefined,
      (event, scene, actor, trigger) => {
        output.push(event.id);
        if (trigger) {
          output.push(trigger.id);
        }
      }
    );

    expect(output).toEqual(["0", "1", "trigger1"]);
  });

  // Test for walking scripts in scenes with actor and trigger prefabs
  test("should walk scripts in scenes with actor and trigger prefabs", () => {
    const scenes = [
      {
        ...dummySceneNormalized,
        id: "scene1",
        script: ["0"],
        actors: ["actor1"],
        triggers: ["trigger1"],
      },
    ] as SceneNormalized[];

    const eventsLookup = {
      "0": { ...dummyScriptEventNormalized, id: "0" },
      "1": { ...dummyScriptEventNormalized, id: "1" },
      "2": { ...dummyScriptEventNormalized, id: "2" },
    };

    const actorsLookup = {
      actor1: {
        ...dummyActorNormalized,
        id: "actor1",
        prefabId: "actorPrefab1",
        script: [],
        startScript: [],
        updateScript: [],
      },
    };
    const triggersLookup = {
      trigger1: {
        ...dummyTriggerNormalized,
        id: "trigger1",
        prefabId: "triggerPrefab1",
        script: [],
        leaveScript: [],
      },
    };
    const actorPrefabsLookup = {
      actorPrefab1: {
        ...dummyActorPrefabNormalized,
        id: "actorPrefab1",
        script: ["1"],
      },
    };
    const triggerPrefabsLookup = {
      triggerPrefab1: {
        ...dummyTriggerPrefabNormalized,
        id: "triggerPrefab1",
        script: ["2"],
      },
    };

    const output: string[] = [];

    walkNormalizedScenesScripts(
      scenes,
      eventsLookup,
      actorsLookup,
      triggersLookup,
      actorPrefabsLookup,
      triggerPrefabsLookup,
      undefined,
      (event, scene, actor, trigger) => {
        output.push(event.id);
        if (actor) {
          output.push(actor.id);
        }
        if (trigger) {
          output.push(trigger.id);
        }
      }
    );

    expect(output).toEqual(["0", "1", "actor1", "2", "trigger1"]);
  });

  // Test for handling an empty scene with no scripts, actors, or triggers
  test("should handle an empty scene with no scripts, actors, or triggers", () => {
    const scenes = [
      {
        ...dummySceneNormalized,
        id: "scene1",
        script: [],
        actors: [],
        triggers: [],
      },
    ] as SceneNormalized[];

    const eventsLookup = {};
    const actorsLookup = {};
    const triggersLookup = {};
    const actorPrefabsLookup = {};
    const triggerPrefabsLookup = {};

    const myFn = jest.fn();

    walkNormalizedScenesScripts(
      scenes,
      eventsLookup,
      actorsLookup,
      triggersLookup,
      actorPrefabsLookup,
      triggerPrefabsLookup,
      undefined,
      myFn
    );

    expect(myFn.mock.calls.length).toBe(0);
  });
});

describe("mapActorScript", () => {
  // Test for applying a simple transformation to all scripts in an actor
  test("should apply a simple transformation to all scripts in an actor", () => {
    const actor = {
      ...dummyActor,
      script: [{ ...dummyScriptEvent, id: "0" }],
      startScript: [{ ...dummyScriptEvent, id: "1" }],
      updateScript: [{ ...dummyScriptEvent, id: "2" }],
      hit1Script: [],
      hit2Script: [],
      hit3Script: [],
    } as Actor;

    const transformedActor = mapActorScript(actor, (event) => ({
      ...event,
      id: `transformed-${event.id}`,
    }));

    expect(transformedActor.script).toEqual([
      { ...dummyScriptEvent, id: "transformed-0" },
    ]);
    expect(transformedActor.startScript).toEqual([
      { ...dummyScriptEvent, id: "transformed-1" },
    ]);
    expect(transformedActor.updateScript).toEqual([
      { ...dummyScriptEvent, id: "transformed-2" },
    ]);
  });

  // Test for handling an actor with empty scripts
  test("should handle an actor with empty scripts", () => {
    const actor = {
      ...dummyActor,
      script: [],
      startScript: [],
      updateScript: [],
      hit1Script: [],
      hit2Script: [],
      hit3Script: [],
    } as Actor;

    const transformedActor = mapActorScript(actor, (event) => ({
      ...event,
      id: `transformed-${event.id}`,
    }));

    expect(transformedActor.script).toEqual([]);
    expect(transformedActor.startScript).toEqual([]);
    expect(transformedActor.updateScript).toEqual([]);
  });

  // Test for ensuring the callback is applied to all script keys
  test("should ensure the callback is applied to all script keys", () => {
    const actor = {
      ...dummyActor,
      script: [{ ...dummyScriptEvent, id: "0" }],
      startScript: [{ ...dummyScriptEvent, id: "1" }],
      updateScript: [{ ...dummyScriptEvent, id: "2" }],
      hit1Script: [{ ...dummyScriptEvent, id: "3" }],
      hit2Script: [{ ...dummyScriptEvent, id: "4" }],
      hit3Script: [{ ...dummyScriptEvent, id: "5" }],
    } as Actor;

    const transformedActor = mapActorScript(actor, (event) => ({
      ...event,
      id: `transformed-${event.id}`,
    }));

    expect(transformedActor.script).toEqual([
      { ...dummyScriptEvent, id: "transformed-0" },
    ]);
    expect(transformedActor.startScript).toEqual([
      { ...dummyScriptEvent, id: "transformed-1" },
    ]);
    expect(transformedActor.updateScript).toEqual([
      { ...dummyScriptEvent, id: "transformed-2" },
    ]);
    expect(transformedActor.hit1Script).toEqual([
      { ...dummyScriptEvent, id: "transformed-3" },
    ]);
    expect(transformedActor.hit2Script).toEqual([
      { ...dummyScriptEvent, id: "transformed-4" },
    ]);
    expect(transformedActor.hit3Script).toEqual([
      { ...dummyScriptEvent, id: "transformed-5" },
    ]);
  });

  // Test for handling an actor with nested script children
  test("should handle an actor with nested script children", () => {
    const actor = {
      ...dummyActor,
      script: [
        {
          ...dummyScriptEvent,
          id: "0",
          children: {
            true: [{ ...dummyScriptEvent, id: "1" }],
          },
        },
      ],
      startScript: [],
      updateScript: [],
      hit1Script: [],
      hit2Script: [],
      hit3Script: [],
    } as Actor;

    const transformedActor = mapActorScript(actor, (event) => ({
      ...event,
      id: `transformed-${event.id}`,
    }));

    expect(transformedActor.script).toEqual([
      {
        ...dummyScriptEvent,
        id: "transformed-0",
        children: {
          true: [{ ...dummyScriptEvent, id: "transformed-1" }],
        },
      },
    ]);
  });

  // Test for ensuring original actor object is not mutated
  test("should not mutate the original actor object", () => {
    const actor = {
      ...dummyActor,
      script: [{ ...dummyScriptEvent, id: "0" }],
      startScript: [{ ...dummyScriptEvent, id: "1" }],
      updateScript: [],
      hit1Script: [],
      hit2Script: [],
      hit3Script: [],
    } as Actor;

    const originalActor = { ...actor };
    const transformedActor = mapActorScript(actor, (event) => ({
      ...event,
      id: `transformed-${event.id}`,
    }));

    expect(actor).toEqual(originalActor);
    expect(transformedActor).not.toEqual(originalActor);
  });
});

describe("mapTriggerScript", () => {
  // Test for applying a simple transformation to all scripts in a trigger
  test("should apply a simple transformation to all scripts in a trigger", () => {
    const trigger = {
      ...dummyTrigger,
      script: [{ ...dummyScriptEvent, id: "0" }],
      leaveScript: [{ ...dummyScriptEvent, id: "1" }],
    } as Trigger;

    const transformedTrigger = mapTriggerScript(trigger, (event) => ({
      ...event,
      id: `transformed-${event.id}`,
    }));

    expect(transformedTrigger.script).toEqual([
      { ...dummyScriptEvent, id: "transformed-0" },
    ]);
    expect(transformedTrigger.leaveScript).toEqual([
      { ...dummyScriptEvent, id: "transformed-1" },
    ]);
  });

  // Test for handling a trigger with empty scripts
  test("should handle a trigger with empty scripts", () => {
    const trigger = {
      ...dummyTrigger,
      script: [],
      leaveScript: [],
    } as Trigger;

    const transformedTrigger = mapTriggerScript(trigger, (event) => ({
      ...event,
      id: `transformed-${event.id}`,
    }));

    expect(transformedTrigger.script).toEqual([]);
    expect(transformedTrigger.leaveScript).toEqual([]);
  });

  // Test for ensuring the callback is applied to both script keys
  test("should ensure the callback is applied to both script and leaveScript keys", () => {
    const trigger = {
      ...dummyTrigger,
      script: [{ ...dummyScriptEvent, id: "0" }],
      leaveScript: [{ ...dummyScriptEvent, id: "1" }],
    } as Trigger;

    const transformedTrigger = mapTriggerScript(trigger, (event) => ({
      ...event,
      id: `transformed-${event.id}`,
    }));

    expect(transformedTrigger.script).toEqual([
      { ...dummyScriptEvent, id: "transformed-0" },
    ]);
    expect(transformedTrigger.leaveScript).toEqual([
      { ...dummyScriptEvent, id: "transformed-1" },
    ]);
  });

  // Test for handling a trigger with nested script children
  test("should handle a trigger with nested script children", () => {
    const trigger = {
      ...dummyTrigger,
      script: [
        {
          ...dummyScriptEvent,
          id: "0",
          children: {
            true: [{ ...dummyScriptEvent, id: "1" }],
          },
        },
      ],
      leaveScript: [],
    } as Trigger;

    const transformedTrigger = mapTriggerScript(trigger, (event) => ({
      ...event,
      id: `transformed-${event.id}`,
    }));

    expect(transformedTrigger.script).toEqual([
      {
        ...dummyScriptEvent,
        id: "transformed-0",
        children: {
          true: [{ ...dummyScriptEvent, id: "transformed-1" }],
        },
      },
    ]);
  });

  // Test for ensuring original trigger object is not mutated
  test("should not mutate the original trigger object", () => {
    const trigger = {
      ...dummyTrigger,
      script: [{ ...dummyScriptEvent, id: "0" }],
      leaveScript: [{ ...dummyScriptEvent, id: "1" }],
    } as Trigger;

    const originalTrigger = { ...trigger };
    const transformedTrigger = mapTriggerScript(trigger, (event) => ({
      ...event,
      id: `transformed-${event.id}`,
    }));

    expect(trigger).toEqual(originalTrigger);
    expect(transformedTrigger).not.toEqual(originalTrigger);
  });
});
