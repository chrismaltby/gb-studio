import migrateProject from "../../src/lib/project/migrateProject";

test("should migrate conditional events from 1.0.0 to 2.0.0", () => {
  const oldProject = {
    _version: "1",
    settings: {},
    scenes: [
      {
        actors: [],
        triggers: [],
        collisions: [],
        script: [
          {
            command: "EVENT_IF_TRUE",
            true: [
              {
                command: "EVENT_TEXT",
                args: {
                  text: "Hello",
                },
              },
            ],
            false: [
              {
                command: "EVENT_TEXT",
                args: {
                  text: "World",
                },
              },
            ],
          },
        ],
      },
    ],
    backgrounds: [],
    spriteSheets: [],
  };

  const newProject = JSON.parse(JSON.stringify(migrateProject(oldProject)));
  expect(newProject).toEqual({
    _version: "2.0.0",
    _release: "8",
    settings: {
      startMoveSpeed: 1,
      startAnimSpeed: 15,
      defaultBackgroundPaletteIds: [
        "dmg",
        "dmg",
        "dmg",
        "dmg",
        "dmg",
        "dmg",
        "dmg",
        "dmg",
      ],
      defaultSpritePaletteIds: [
        "dmg",
        "dmg",
        "dmg",
        "dmg",
        "dmg",
        "dmg",
        "dmg",
        "dmg",
      ],
      defaultPlayerSprites: {},
    },
    scenes: [
      {
        width: 32,
        height: 32,
        type: "TOPDOWN",
        actors: [],
        triggers: [],
        collisions: [],
        script: [
          {
            command: "EVENT_IF_TRUE",
            children: {
              true: [
                {
                  command: "EVENT_TEXT",
                  args: {
                    text: "Hello",
                  },
                },
              ],
              false: [
                {
                  command: "EVENT_TEXT",
                  args: {
                    text: "World",
                  },
                },
              ],
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

test("should migrate conditional events from 1.2.0 to 2.0.0", () => {
  const oldProject = {
    _version: "1.2.0",
    settings: {},
    scenes: [
      {
        actors: [],
        triggers: [],
        collisions: [],
        script: [
          {
            command: "EVENT_IF_TRUE",
            children: {
              true: [
                {
                  command: "EVENT_TEXT",
                  args: {
                    text: "Hello",
                  },
                },
              ],
              false: [
                {
                  command: "EVENT_TEXT",
                  args: {
                    text: "World",
                  },
                },
              ],
            },
          },
        ],
      },
    ],
    backgrounds: [],
    spriteSheets: [],
  };
  const newProject = JSON.parse(JSON.stringify(migrateProject(oldProject)));
  expect(newProject).toEqual({
    _version: "2.0.0",
    _release: "8",
    settings: {
      startMoveSpeed: 1,
      startAnimSpeed: 15,
      defaultBackgroundPaletteIds: [
        "dmg",
        "dmg",
        "dmg",
        "dmg",
        "dmg",
        "dmg",
        "dmg",
        "dmg",
      ],
      defaultSpritePaletteIds: [
        "dmg",
        "dmg",
        "dmg",
        "dmg",
        "dmg",
        "dmg",
        "dmg",
        "dmg",
      ],
      defaultPlayerSprites: {},
    },
    scenes: [
      {
        width: 32,
        height: 32,
        type: "TOPDOWN",
        actors: [],
        triggers: [],
        collisions: [],
        script: [
          {
            command: "EVENT_IF_TRUE",
            children: {
              true: [
                {
                  command: "EVENT_TEXT",
                  args: {
                    text: "Hello",
                  },
                },
              ],
              false: [
                {
                  command: "EVENT_TEXT",
                  args: {
                    text: "World",
                  },
                },
              ],
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
