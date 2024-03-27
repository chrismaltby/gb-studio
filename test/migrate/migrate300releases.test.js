import {
  migrateFrom300r2To300r3,
  migrateFrom300r3To310r1ScriptEvent,
  migrateFrom300r3To310r1Event,
  migrateFrom300r3To310r1,
  migrateFrom310r1To310r2Event,
  migrateFrom310r3To311r1Event,
  migrateFrom320r1To320r2Event,
  migrateFrom320r2To330r1Settings,
} from "../../src/lib/project/migrateProject";
import initElectronL10N from "../../src/lib/lang/initElectronL10N";
import { getTestScriptHandlers } from "../getTestScriptHandlers";

beforeAll(async () => {
  await initElectronL10N();
});

test("should not fail on empty project", () => {
  const oldProject = {
    scenes: [],
    customEvents: [],
    variables: [],
  };
  expect(migrateFrom300r2To300r3(oldProject)).toEqual({
    scenes: [],
    customEvents: [],
    variables: [],
  });
});

test("should add generated symbols to scenes based on scene name", () => {
  const oldProject = {
    scenes: [
      {
        name: "Hello World",
        actors: [],
        triggers: [],
      },
    ],
    customEvents: [],
    variables: [],
  };
  expect(migrateFrom300r2To300r3(oldProject)).toEqual({
    scenes: [
      {
        name: "Hello World",
        symbol: "scene_hello_world",
        actors: [],
        triggers: [],
      },
    ],
    customEvents: [],
    variables: [],
  });
});

test("should add generate the same symbol for two scenes with the same name (this gets fixed later in ensureSymbolsUnique)", () => {
  const oldProject = {
    scenes: [
      {
        name: "Hello World",
        actors: [],
        triggers: [],
      },
      {
        name: "Hello World",
        actors: [],
        triggers: [],
      },
    ],
    customEvents: [],
    variables: [],
  };
  expect(migrateFrom300r2To300r3(oldProject)).toEqual({
    scenes: [
      {
        name: "Hello World",
        symbol: "scene_hello_world",
        actors: [],
        triggers: [],
      },
      {
        name: "Hello World",
        symbol: "scene_hello_world",
        actors: [],
        triggers: [],
      },
    ],
    customEvents: [],
    variables: [],
  });
});

test("should generate symbol based on index for scenes with empty name", () => {
  const oldProject = {
    scenes: [
      {
        name: "",
        actors: [],
        triggers: [],
      },
      {
        name: "",
        actors: [],
        triggers: [],
      },
    ],
    customEvents: [],
    variables: [],
  };
  expect(migrateFrom300r2To300r3(oldProject)).toEqual({
    scenes: [
      {
        name: "",
        symbol: "scene_1",
        actors: [],
        triggers: [],
      },
      {
        name: "",
        symbol: "scene_2",
        actors: [],
        triggers: [],
      },
    ],
    customEvents: [],
    variables: [],
  });
});

test("should add generated symbols to custom events based on name", () => {
  const oldProject = {
    scenes: [],
    customEvents: [
      {
        name: "Hello World",
      },
    ],
    variables: [],
  };
  expect(migrateFrom300r2To300r3(oldProject)).toEqual({
    scenes: [],
    customEvents: [
      {
        name: "Hello World",
        symbol: "script_hello_world",
      },
    ],
    variables: [],
  });
});

test("should generate symbol based on index for custom events with empty name", () => {
  const oldProject = {
    scenes: [],
    customEvents: [
      {
        name: "",
      },
      {
        name: "",
      },
    ],
    variables: [],
  };
  expect(migrateFrom300r2To300r3(oldProject)).toEqual({
    scenes: [],
    customEvents: [
      {
        name: "",
        symbol: "script_1",
      },
      {
        name: "",
        symbol: "script_2",
      },
    ],
    variables: [],
  });
});

test("should add generated symbols to actors and triggers based on name", () => {
  const oldProject = {
    scenes: [
      {
        name: "Hello World",
        actors: [
          {
            name: "My Actor",
          },
          {
            name: "",
          },
        ],
        triggers: [
          {
            name: "",
          },
          {
            name: "My Trigger",
          },
        ],
      },
    ],
    customEvents: [],
    variables: [],
  };
  expect(migrateFrom300r2To300r3(oldProject)).toEqual({
    scenes: [
      {
        name: "Hello World",
        symbol: "scene_hello_world",
        actors: [
          {
            name: "My Actor",
            symbol: "actor_my_actor",
          },
          {
            name: "",
            symbol: "actor_0",
          },
        ],
        triggers: [
          {
            name: "",
            symbol: "trigger_0",
          },
          {
            name: "My Trigger",
            symbol: "trigger_my_trigger",
          },
        ],
      },
    ],
    customEvents: [],
    variables: [],
  });
});

test("should migrate custom script events to prefix values with V", async () => {
  const oldEvent = {
    command: "EVENT_INC_VALUE",
    args: {
      variable: "0",
    },
    id: "event-1",
  };
  const scriptEventHandlers = await getTestScriptHandlers();
  expect(
    migrateFrom300r3To310r1ScriptEvent(oldEvent, scriptEventHandlers)
  ).toEqual({
    command: "EVENT_INC_VALUE",
    args: {
      variable: "V0",
    },
    id: "event-1",
  });
});

test("should migrate custom script events to prefix values with V when using union types", async () => {
  const oldEvent = {
    command: "EVENT_ACTOR_SET_DIRECTION",
    args: {
      actorId: "player",
      direction: {
        type: "variable",
        value: "3",
      },
    },
    id: "event-1",
  };
  const scriptEventHandlers = await getTestScriptHandlers();
  expect(
    migrateFrom300r3To310r1ScriptEvent(oldEvent, scriptEventHandlers)
  ).toEqual({
    command: "EVENT_ACTOR_SET_DIRECTION",
    args: {
      actorId: "player",
      direction: {
        type: "variable",
        value: "V3",
      },
    },
    id: "event-1",
  });
});

test("should migrate custom script calls to include missing values, convert to union type and prefix variable with V", () => {
  const oldEvent = {
    command: "EVENT_CALL_CUSTOM_EVENT",
    args: {
      customEventId: "script-1",
      "$variable[1]$": "L1",
    },
    id: "event-1",
  };
  const customEvents = [
    {
      id: "script-1",
      name: "Script 1",
      variables: {
        0: {
          id: "0",
          name: "Variable A",
        },
        1: {
          id: "1",
          name: "output",
        },
      },
    },
  ];
  expect(migrateFrom300r3To310r1Event(oldEvent, customEvents)).toEqual({
    command: "EVENT_CALL_CUSTOM_EVENT",
    args: {
      customEventId: "script-1",
      "$variable[V0]$": {
        type: "variable",
        value: "0",
      },
      "$variable[V1]$": {
        type: "variable",
        value: "L1",
      },
    },
    id: "event-1",
  });
});

test("should not migrate custom script calls to include missing values if custom event is unknown ", () => {
  const oldEvent = {
    command: "EVENT_CALL_CUSTOM_EVENT",
    args: {
      customEventId: "script-1",
      "$variable[1]$": "L1",
    },
    id: "event-1",
  };
  const customEvents = [];
  expect(migrateFrom300r3To310r1Event(oldEvent, customEvents)).toEqual(
    oldEvent
  );
});

test("should migrate engine field store events to set missing variables to 0", () => {
  const oldEvent = {
    command: "EVENT_ENGINE_FIELD_STORE",
    args: {
      engineFieldKey: "plat_run_vel",
    },
    id: "event-1",
  };
  const customEvents = [];
  expect(migrateFrom300r3To310r1Event(oldEvent, customEvents)).toEqual({
    command: "EVENT_ENGINE_FIELD_STORE",
    args: {
      engineFieldKey: "plat_run_vel",
      value: "0",
    },
    id: "event-1",
  });
});

test("should keep existing engine field store events variable value if set", () => {
  const oldEvent = {
    command: "EVENT_ENGINE_FIELD_STORE",
    args: {
      engineFieldKey: "plat_run_vel",
      value: "5",
    },
    id: "event-1",
  };
  const customEvents = [];
  expect(migrateFrom300r3To310r1Event(oldEvent, customEvents)).toEqual({
    command: "EVENT_ENGINE_FIELD_STORE",
    args: {
      engineFieldKey: "plat_run_vel",
      value: "5",
    },
    id: "event-1",
  });
});

test("should migrate custom event definitions", async () => {
  const scriptEventHandlers = await getTestScriptHandlers();
  const oldProject = {
    scenes: [],
    customEvents: [
      {
        id: "script-1",
        variables: {
          0: {
            id: "0",
            name: "Variable A",
          },
          1: {
            id: "1",
            name: "output",
          },
          2: {
            id: "2",
            name: "Variable C",
          },
        },
        actors: {
          0: {
            id: "0",
            name: "Actor A",
          },
          1: {
            id: "1",
            name: "Actor B",
          },
        },
        script: [
          {
            command: "EVENT_INC_VALUE",
            args: {
              variable: "1",
            },
            id: "event-1",
          },
        ],
      },
    ],
  };
  expect(migrateFrom300r3To310r1(oldProject, scriptEventHandlers)).toEqual({
    scenes: [],
    customEvents: [
      {
        id: "script-1",
        variables: {
          V0: {
            id: "V0",
            name: "Variable A",
            passByReference: true,
          },
          V1: {
            id: "V1",
            name: "output",
            passByReference: true,
          },
          V2: {
            id: "V2",
            name: "Variable C",
            passByReference: true,
          },
        },
        actors: {
          0: {
            id: "0",
            name: "Actor A",
          },
          1: {
            id: "1",
            name: "Actor B",
          },
        },
        script: [
          {
            command: "EVENT_INC_VALUE",
            args: {
              variable: "V1",
            },
            id: "event-1",
          },
        ],
      },
    ],
  });
});

test("should migrate projectiles to default new fields to true", () => {
  const oldEvent = {
    command: "EVENT_LAUNCH_PROJECTILE",
    args: {
      spriteSheetId: "32c48a4d-6ce6-4aca-a23a-a6300b5c9e3b",
      actorId: "0",
      direction: "left",
      speed: 1,
      collisionGroup: "1",
      collisionMask: ["player"],
      animSpeed: 7,
      lifeTime: 1,
      directionType: "direction",
      angleVariable: "0",
      angle: 0,
      otherActorId: "$self$",
    },
    id: "event-1",
  };
  const customEvents = [];
  expect(migrateFrom310r1To310r2Event(oldEvent, customEvents)).toEqual({
    command: "EVENT_LAUNCH_PROJECTILE",
    args: {
      spriteSheetId: "32c48a4d-6ce6-4aca-a23a-a6300b5c9e3b",
      actorId: "0",
      direction: "left",
      speed: 1,
      collisionGroup: "1",
      collisionMask: ["player"],
      animSpeed: 7,
      lifeTime: 1,
      directionType: "direction",
      angleVariable: "0",
      angle: 0,
      otherActorId: "$self$",
      loopAnim: true,
      destroyOnHit: true,
    },
    id: "event-1",
  });
});

test("should add timer contexts to timer scripts", () => {
  const oldEvent1 = {
    command: "EVENT_SET_TIMER_SCRIPT",
    args: {
      duration: 0.5,
      frames: 30,
    },
    children: [],
    id: "event-1",
  };
  const oldEvent2 = {
    command: "EVENT_TIMER_RESTART",
    args: {},
    id: "event-2",
  };
  const oldEvent3 = {
    command: "EVENT_TIMER_DISABLE",
    args: {},
    id: "event-3",
  };
  const customEvents = [];
  expect(migrateFrom310r3To311r1Event(oldEvent1, customEvents)).toEqual({
    command: "EVENT_SET_TIMER_SCRIPT",
    args: {
      duration: 0.5,
      frames: 30,
      timer: 1,
    },
    children: [],
    id: "event-1",
  });
  expect(migrateFrom310r3To311r1Event(oldEvent2, customEvents)).toEqual({
    command: "EVENT_TIMER_RESTART",
    args: {
      timer: 1,
    },
    id: "event-2",
  });
  expect(migrateFrom310r3To311r1Event(oldEvent3, customEvents)).toEqual({
    command: "EVENT_TIMER_DISABLE",
    args: {
      timer: 1,
    },
    id: "event-3",
  });
});

test("should add magnitude to camera shake events", () => {
  const oldEvent1 = {
    command: "EVENT_CAMERA_SHAKE",
    args: {
      time: 0.5,
      frames: 10,
      shakeDirection: "diagonal",
      units: "frames",
    },
    id: "event-1",
  };
  const oldEvent2 = {
    command: "EVENT_CAMERA_SHAKE",
    args: {
      time: 1,
    },
    id: "event-2",
  };
  const customEvents = [];
  expect(migrateFrom320r1To320r2Event(oldEvent1, customEvents)).toEqual({
    command: "EVENT_CAMERA_SHAKE",
    args: {
      time: 0.5,
      frames: 10,
      shakeDirection: "diagonal",
      magnitude: {
        type: "number",
        value: 5,
      },
      units: "frames",
    },
    id: "event-1",
  });
  expect(migrateFrom320r1To320r2Event(oldEvent2, customEvents)).toEqual({
    command: "EVENT_CAMERA_SHAKE",
    args: {
      time: 1,
      magnitude: {
        type: "number",
        value: 5,
      },
    },
    id: "event-2",
  });
});

test("should migrate customColorsEnabled=false to colorMode=mono", () => {
  const oldProject = {
    settings: {
      customColorsEnabled: false,
    },
  };
  expect(migrateFrom320r2To330r1Settings(oldProject)).toMatchObject({
    settings: {
      colorMode: "mono",
    },
  });
});

test("should migrate customColorsEnabled=true to colorMode=mixed", () => {
  const oldProject = {
    settings: {
      customColorsEnabled: true,
    },
  };
  expect(migrateFrom320r2To330r1Settings(oldProject)).toMatchObject({
    settings: {
      colorMode: "mixed",
    },
  });
});

test("should migrate missing customColorsEnabled to colorMode=mono", () => {
  const oldProject = {
    settings: {},
  };
  expect(migrateFrom320r2To330r1Settings(oldProject)).toMatchObject({
    settings: {
      colorMode: "mono",
    },
  });
});
