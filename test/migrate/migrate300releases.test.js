import { migrateFrom300r2To300r3 } from "../../src/lib/project/migrateProject";

test("should not fail on empty project", () => {
  const oldProject = {
    scenes: [],
    customEvents: [],
  };
  expect(migrateFrom300r2To300r3(oldProject)).toEqual({
    scenes: [],
    customEvents: [],
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
  };
  expect(migrateFrom300r2To300r3(oldProject)).toEqual({
    scenes: [],
    customEvents: [
      {
        name: "Hello World",
        symbol: "script_hello_world",
      },
    ],
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
  });
});
