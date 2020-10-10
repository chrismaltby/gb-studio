import migrateProject, {
  migrateFrom200r1To200r2Event,
} from "../../src/lib/project/migrateProject";

test("should migrate player set sprite with persist=true to match old default", () => {
  const oldEvent = {
    id: "abc",
    command: "EVENT_PLAYER_SET_SPRITE",
    args: {
      spriteSheetId: "def",
    },
  };
  expect(migrateFrom200r1To200r2Event(oldEvent)).toEqual({
    id: "abc",
    command: "EVENT_PLAYER_SET_SPRITE",
    args: {
      spriteSheetId: "def",
      persist: true,
    },
  });
});

test("should migrate EVENT_PLAYER_SET_SPRITE events from 2.0.0 r1 to 2.0.0 r2", () => {
  const oldProject = {
    _version: "2.0.0",
    scenes: [
      {
        actors: [],
        triggers: [],
        collisions: [],
        script: [
          {
            id: "abc",
            command: "EVENT_PLAYER_SET_SPRITE",
            args: {
              spriteSheetId: "def",
            },
          },
        ],
        playerHit1Script: [],
        playerHit2Script: [],
        playerHit3Script: [],
      },
    ],
    backgrounds: [],
    customEvents: [],
  };
  const newProject = JSON.parse(JSON.stringify(migrateProject(oldProject)));
  expect(newProject).toEqual({
    _version: "2.0.0",
    _release: "3",
    scenes: [
      {
        actors: [],
        triggers: [],
        collisions: [],
        script: [
          {
            id: "abc",
            command: "EVENT_PLAYER_SET_SPRITE",
            args: {
              spriteSheetId: "def",
              persist: true,
            },
          },
        ],
        playerHit1Script: [],
        playerHit2Script: [],
        playerHit3Script: [],
      },
    ],
    backgrounds: [],
    customEvents: [],
  });
});

test("should not migrate EVENT_PLAYER_SET_SPRITE events if already on 2.0.0 r2+", () => {
  const oldProject = {
    _version: "2.0.0",
    _release: "3",
    scenes: [
      {
        actors: [],
        triggers: [],
        collisions: [],
        script: [
          {
            id: "abc",
            command: "EVENT_PLAYER_SET_SPRITE",
            args: {
              spriteSheetId: "def",
              persist: false,
            },
          },
        ],
        playerHit1Script: [],
        playerHit2Script: [],
        playerHit3Script: [],
      },
    ],
    backgrounds: [],
    customEvents: [],
  };
  const newProject = JSON.parse(JSON.stringify(migrateProject(oldProject)));
  expect(newProject).toEqual(oldProject);
});

test("should migrate EVENT_SET_INPUT_SCRIPT events from 2.0.0 r2 to 2.0.0 r3", () => {
  const oldProject = {
    _version: "2.0.0",
    scenes: [
      {
        actors: [],
        triggers: [],
        collisions: [],
        script: [
          {
            id: "abc",
            command: "EVENT_SET_INPUT_SCRIPT",
            args: {
              input: "a",
            },
          },
        ],
        playerHit1Script: [],
        playerHit2Script: [],
        playerHit3Script: [],
      },
    ],
    backgrounds: [],
    customEvents: [],
  };
  const newProject = JSON.parse(JSON.stringify(migrateProject(oldProject)));
  expect(newProject).toEqual({
    _version: "2.0.0",
    _release: "3",
    scenes: [
      {
        actors: [],
        triggers: [],
        collisions: [],
        script: [
          {
            id: "abc",
            command: "EVENT_SET_INPUT_SCRIPT",
            args: {
              input: ["a"]
            },
          },
        ],
        playerHit1Script: [],
        playerHit2Script: [],
        playerHit3Script: [],
      },
    ],
    backgrounds: [],
    customEvents: [],
  });
});

test("should not migrate 2.0.0 r2 EVENT_SET_INPUT_SCRIPT events if they already were arrays (not sure if possible)", () => {
  const oldProject = {
    _version: "2.0.0",
    scenes: [
      {
        actors: [],
        triggers: [],
        collisions: [],
        script: [
          {
            id: "abc",
            command: "EVENT_SET_INPUT_SCRIPT",
            args: {
              input: ["a", "b"],
            },
          },
        ],
        playerHit1Script: [],
        playerHit2Script: [],
        playerHit3Script: [],
      },
    ],
    backgrounds: [],
    customEvents: [],
  };
  const newProject = JSON.parse(JSON.stringify(migrateProject(oldProject)));
  expect(newProject).toEqual({
    _version: "2.0.0",
    _release: "3",
    scenes: [
      {
        actors: [],
        triggers: [],
        collisions: [],
        script: [
          {
            id: "abc",
            command: "EVENT_SET_INPUT_SCRIPT",
            args: {
              input: ["a", "b"]
            },
          },
        ],
        playerHit1Script: [],
        playerHit2Script: [],
        playerHit3Script: [],
      },
    ],
    backgrounds: [],
    customEvents: [],
  });
});
