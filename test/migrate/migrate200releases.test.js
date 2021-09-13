import migrateProject, {
  migrateFrom200r1To200r2Event,
  migrateFrom200r9To200r10Triggers,
  LATEST_PROJECT_VERSION,
  LATEST_PROJECT_MINOR_VERSION,
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
    settings: {
      startAnimSpeed: 3,
    },
    scenes: [
      {
        type: "TOPDOWN",
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
    spriteSheets: [],
  };
  const newProject = JSON.parse(JSON.stringify(migrateProject(oldProject)));
  expect(newProject).toMatchObject({
    _version: LATEST_PROJECT_VERSION,
    _release: LATEST_PROJECT_MINOR_VERSION,
    settings: {
      startMoveSpeed: 1,
      startAnimSpeed: 15,
    },
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
    spriteSheets: [],
    engineFieldValues: [
      {
        id: "fade_style",
        value: 0,
      },
    ],
  });
});

test("should not migrate EVENT_PLAYER_SET_SPRITE events if already on 2.0.0 r2+", () => {
  const oldProject = {
    _version: "2.0.0",
    _release: "3",
    settings: {},
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
        spriteSheets: [],
      },
    ],
    backgrounds: [],
    customEvents: [],
    spriteSheets: [],
  };
  const newProject = JSON.parse(JSON.stringify(migrateProject(oldProject)));
  expect(newProject.scenes.script).toEqual(oldProject.scenes.script);
});

test("should migrate EVENT_SET_INPUT_SCRIPT events from 2.0.0 r2 to 2.0.0 r4", () => {
  const oldProject = {
    _version: "2.0.0",
    settings: {},
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
        spriteSheets: [],
      },
    ],
    backgrounds: [],
    customEvents: [],
    spriteSheets: [],
  };
  const newProject = JSON.parse(JSON.stringify(migrateProject(oldProject)));
  expect(newProject).toMatchObject({
    _version: LATEST_PROJECT_VERSION,
    _release: LATEST_PROJECT_MINOR_VERSION,
    settings: {
      startMoveSpeed: 1,
      startAnimSpeed: 15,
    },
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
              input: ["a"],
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
    spriteSheets: [],
    engineFieldValues: [
      {
        id: "fade_style",
        value: 0,
      },
    ],
  });
});

test("should not migrate 2.0.0 r2 EVENT_SET_INPUT_SCRIPT events if they already were arrays (not sure if possible)", () => {
  const oldProject = {
    _version: "2.0.0",
    settings: {},
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
    spriteSheets: [],
  };
  const newProject = JSON.parse(JSON.stringify(migrateProject(oldProject)));
  expect(newProject).toMatchObject({
    _version: LATEST_PROJECT_VERSION,
    _release: LATEST_PROJECT_MINOR_VERSION,
    settings: {
      startMoveSpeed: 1,
      startAnimSpeed: 15,
    },
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
    engineFieldValues: [
      {
        id: "fade_style",
        value: 0,
      },
    ],
    backgrounds: [],
    customEvents: [],
    spriteSheets: [],
  });
});

test("should migrate 2.0.0 r4 EVENT_ACTOR_SET_ANIMATION_SPEED events to store as number|null", () => {
  const oldProject = {
    _version: "2.0.0",
    _release: "4",
    settings: {},
    scenes: [
      {
        actors: [],
        triggers: [],
        collisions: [],
        script: [
          {
            id: "abc",
            command: "EVENT_ACTOR_SET_ANIMATION_SPEED",
            args: {
              speed: "5",
            },
          },
          {
            id: "def",
            command: "EVENT_ACTOR_SET_ANIMATION_SPEED",
            args: {},
          },
          {
            id: "xyz",
            command: "EVENT_ACTOR_SET_ANIMATION_SPEED",
            args: {
              speed: "",
            },
          },
          {
            id: "qwe",
            command: "EVENT_ACTOR_SET_ANIMATION_SPEED",
            args: {
              speed: 2,
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
    spriteSheets: [],
  };
  const newProject = JSON.parse(JSON.stringify(migrateProject(oldProject)));
  expect(newProject).toMatchObject({
    _version: LATEST_PROJECT_VERSION,
    _release: LATEST_PROJECT_MINOR_VERSION,
    settings: {
      startAnimSpeed: 15,
      startMoveSpeed: 1,
    },
    scenes: [
      {
        actors: [],
        triggers: [],
        collisions: [],
        script: [
          {
            id: "abc",
            command: "EVENT_ACTOR_SET_ANIMATION_SPEED",
            args: {
              speed: 15,
            },
          },
          {
            id: "def",
            command: "EVENT_ACTOR_SET_ANIMATION_SPEED",
            args: {
              speed: 15,
            },
          },
          {
            id: "xyz",
            command: "EVENT_ACTOR_SET_ANIMATION_SPEED",
            args: {
              speed: 15,
            },
          },
          {
            id: "qwe",
            command: "EVENT_ACTOR_SET_ANIMATION_SPEED",
            args: {
              speed: 31,
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
    spriteSheets: [],
  });
});

test("should migrate 2.0.0 r4 EVENT_ACTOR_SET_MOVEMENT_SPEED events to store as number", () => {
  const oldProject = {
    _version: "2.0.0",
    _release: "4",
    settings: {},
    scenes: [
      {
        actors: [],
        triggers: [],
        collisions: [],
        script: [
          {
            id: "abc",
            command: "EVENT_ACTOR_SET_MOVEMENT_SPEED",
            args: {
              speed: "5",
            },
          },
          {
            id: "def",
            command: "EVENT_ACTOR_SET_MOVEMENT_SPEED",
            args: {},
          },
          {
            id: "xyz",
            command: "EVENT_ACTOR_SET_MOVEMENT_SPEED",
            args: {
              speed: "",
            },
          },
          {
            id: "qwe",
            command: "EVENT_ACTOR_SET_MOVEMENT_SPEED",
            args: {
              speed: 2,
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
    spriteSheets: [],
  };
  const newProject = JSON.parse(JSON.stringify(migrateProject(oldProject)));
  expect(newProject).toMatchObject({
    _version: LATEST_PROJECT_VERSION,
    _release: LATEST_PROJECT_MINOR_VERSION,
    settings: {
      startAnimSpeed: 15,
      startMoveSpeed: 1,
    },
    scenes: [
      {
        actors: [],
        triggers: [],
        collisions: [],
        script: [
          {
            id: "abc",
            command: "EVENT_ACTOR_SET_MOVEMENT_SPEED",
            args: {
              speed: 5,
            },
          },
          {
            id: "def",
            command: "EVENT_ACTOR_SET_MOVEMENT_SPEED",
            args: {
              speed: 1,
            },
          },
          {
            id: "xyz",
            command: "EVENT_ACTOR_SET_MOVEMENT_SPEED",
            args: {
              speed: 1,
            },
          },
          {
            id: "qwe",
            command: "EVENT_ACTOR_SET_MOVEMENT_SPEED",
            args: {
              speed: 2,
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
    spriteSheets: [],
  });
});

test("should migrate 2.0.0 r4 EVENT_LAUNCH_PROJECTILE events to store as number", () => {
  const oldProject = {
    _version: "2.0.0",
    _release: "4",
    settings: {},
    scenes: [
      {
        actors: [],
        triggers: [],
        collisions: [],
        script: [
          {
            id: "abc",
            command: "EVENT_LAUNCH_PROJECTILE",
            args: {
              speed: "5",
            },
          },
          {
            id: "def",
            command: "EVENT_LAUNCH_PROJECTILE",
            args: {},
          },
          {
            id: "xyz",
            command: "EVENT_LAUNCH_PROJECTILE",
            args: {
              speed: "",
            },
          },
          {
            id: "qwe",
            command: "EVENT_LAUNCH_PROJECTILE",
            args: {
              speed: 2,
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
    spriteSheets: [],
  };
  const newProject = JSON.parse(JSON.stringify(migrateProject(oldProject)));
  expect(newProject).toMatchObject({
    _version: LATEST_PROJECT_VERSION,
    _release: LATEST_PROJECT_MINOR_VERSION,
    settings: {
      startAnimSpeed: 15,
      startMoveSpeed: 1,
    },
    scenes: [
      {
        actors: [],
        triggers: [],
        collisions: [],
        script: [
          {
            id: "abc",
            command: "EVENT_LAUNCH_PROJECTILE",
            args: {
              speed: 5,
            },
          },
          {
            id: "def",
            command: "EVENT_LAUNCH_PROJECTILE",
            args: {
              speed: 2,
            },
          },
          {
            id: "xyz",
            command: "EVENT_LAUNCH_PROJECTILE",
            args: {
              speed: 2,
            },
          },
          {
            id: "qwe",
            command: "EVENT_LAUNCH_PROJECTILE",
            args: {
              speed: 2,
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
    spriteSheets: [],
  });
});

test("Should migrate actors to use number|null for animSpeed and number for moveSpeed", () => {
  const oldProject = {
    _version: "2.0.0",
    _release: "4",
    settings: {},
    scenes: [
      {
        actors: [
          {
            animSpeed: "3",
            moveSpeed: "1",
          },
          {
            animSpeed: undefined,
            moveSpeed: undefined,
          },
          {
            animSpeed: "",
            moveSpeed: "5",
          },
          {
            animSpeed: "1",
            moveSpeed: "2",
          },
        ],
        triggers: [],
        collisions: [],
        script: [],
      },
    ],
    backgrounds: [],
    customEvents: [],
    spriteSheets: [],
  };

  const newProject = JSON.parse(JSON.stringify(migrateProject(oldProject)));

  expect(newProject).toMatchObject({
    _version: LATEST_PROJECT_VERSION,
    _release: LATEST_PROJECT_MINOR_VERSION,
    settings: {},
    scenes: [
      {
        actors: [
          {
            animSpeed: 15,
            moveSpeed: 1,
          },
          {
            animSpeed: 15,
            moveSpeed: 1,
          },
          {
            animSpeed: 15,
            moveSpeed: 5,
          },
          {
            animSpeed: 63,
            moveSpeed: 2,
          },
        ],
        triggers: [],
        collisions: [],
        script: [],
      },
    ],
  });
});

test("Should migrate player to use number|null for animSpeed and number for moveSpeed", () => {
  const oldProject1 = {
    _version: "2.0.0",
    _release: "4",
    settings: {
      startMoveSpeed: "3",
      startAnimSpeed: "1",
    },
    scenes: [],
    backgrounds: [],
    customEvents: [],
    spriteSheets: [],
  };

  const oldProject2 = {
    _version: "2.0.0",
    _release: "4",
    settings: {
      startMoveSpeed: undefined,
      startAnimSpeed: undefined,
    },
    scenes: [],
    backgrounds: [],
    customEvents: [],
    spriteSheets: [],
  };

  const oldProject3 = {
    _version: "2.0.0",
    _release: "4",
    settings: {
      startMoveSpeed: "",
      startAnimSpeed: "",
    },
    scenes: [],
    backgrounds: [],
    customEvents: [],
    spriteSheets: [],
  };

  const newProject1 = JSON.parse(JSON.stringify(migrateProject(oldProject1)));
  const newProject2 = JSON.parse(JSON.stringify(migrateProject(oldProject2)));
  const newProject3 = JSON.parse(JSON.stringify(migrateProject(oldProject3)));

  expect(newProject1).toMatchObject({
    _version: LATEST_PROJECT_VERSION,
    _release: LATEST_PROJECT_MINOR_VERSION,
    settings: {
      startMoveSpeed: 3,
      startAnimSpeed: 63,
    },
    scenes: [],
  });

  expect(newProject2).toMatchObject({
    _version: LATEST_PROJECT_VERSION,
    _release: LATEST_PROJECT_MINOR_VERSION,
    settings: {
      startMoveSpeed: 1,
      startAnimSpeed: 15,
    },
    scenes: [],
  });

  expect(newProject3).toMatchObject({
    _version: LATEST_PROJECT_VERSION,
    _release: LATEST_PROJECT_MINOR_VERSION,
    settings: {
      startMoveSpeed: 1,
      startAnimSpeed: 15,
    },
    scenes: [],
  });
});

test("Should migrate actors to use string for collisionGroup", () => {
  const oldProject = {
    _version: "2.0.0",
    _release: "5",
    settings: {},
    scenes: [
      {
        actors: [
          {
            collisionGroup: [],
          },
          {
            collisionGroup: ["2"],
          },
          {
            collisionGroup: ["1", "2"],
          },
          {
            collisionGroup: undefined,
          },
          {
            collisionGroup: "",
          },
          {
            collisionGroup: "3",
          },
        ],
        triggers: [],
        collisions: [],
        script: [],
      },
    ],
    backgrounds: [],
    customEvents: [],
    spriteSheets: [],
  };

  const newProject = JSON.parse(JSON.stringify(migrateProject(oldProject)));

  expect(newProject).toMatchObject({
    _version: LATEST_PROJECT_VERSION,
    _release: LATEST_PROJECT_MINOR_VERSION,
    settings: {},
    scenes: [
      {
        actors: [
          {
            collisionGroup: "",
          },
          {
            collisionGroup: "2",
          },
          {
            collisionGroup: "1",
          },
          {
            collisionGroup: "",
          },
          {
            collisionGroup: "",
          },
          {
            collisionGroup: "3",
          },
        ],
        triggers: [],
        collisions: [],
        script: [],
      },
    ],
  });
});

describe("migrateFrom200r9To200r10Triggers", () => {
  test("Should add leaveScript to all triggers", () => {
    const input = {
      scenes: [
        {
          id: "scene1",
          triggers: [
            {
              id: "trigger1",
              script: [
                {
                  id: "event1",
                  command: "EVENT_TEXT",
                  args: { text: "Hello, World" },
                },
              ],
            },
          ],
        },
      ],
      backgrounds: [],
    };
    const output = migrateFrom200r9To200r10Triggers(input);
    expect(output.scenes).toHaveLength(1);
    expect(output.scenes[0].triggers).toHaveLength(1);
    expect(output.scenes[0].triggers[0].script).toEqual(
      input.scenes[0].triggers[0].script
    );
    expect(output.scenes[0].triggers[0].leaveScript).toBeDefined();
    expect(output.scenes[0].triggers[0].leaveScript).toHaveLength(0);
  });

  test("Should keep existing leaveScript when migrating if already exists", () => {
    const input = {
      scenes: [
        {
          id: "scene1",
          triggers: [
            {
              id: "trigger1",
              script: [
                {
                  id: "event1",
                  command: "EVENT_TEXT",
                  args: { text: "Hello, World" },
                },
              ],
              leaveScript: [
                {
                  id: "event2",
                  command: "EVENT_TEXT",
                  args: { text: "Goodbye, World" },
                },
              ],
            },
          ],
        },
      ],
      backgrounds: [],
    };
    const output = migrateFrom200r9To200r10Triggers(input);
    expect(output.scenes[0].triggers[0].leaveScript).toBeDefined();
    expect(output.scenes[0].triggers[0].leaveScript).toHaveLength(1);
    expect(output.scenes[0].triggers[0].leaveScript).toEqual(
      input.scenes[0].triggers[0].leaveScript
    );
  });
});
