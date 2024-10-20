import migrateProject, {
  LATEST_LEGACY_PROJECT_VERSION,
  LATEST_LEGACY_PROJECT_MINOR_VERSION,
} from "../../../src/lib/project/migration/legacy/migrateLegacyProjectVersions";
import { migrateLegacyProject } from "../../../src/lib/project/migration/legacy/migrateLegacyProject";

test("should migrate conditional events from 1.0.0 to latest release", () => {
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
    _version: LATEST_LEGACY_PROJECT_VERSION,
    _release: LATEST_LEGACY_PROJECT_MINOR_VERSION,
    settings: {
      colorMode: "mono",
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
        symbol: "scene_1",
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
    variables: [],
    engineFieldValues: [
      {
        id: "fade_style",
        value: 0,
      },
    ],
  });
});

test("should migrate conditional events from 1.2.0 to latest release", () => {
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
    variables: [],
  };
  const newProject = JSON.parse(JSON.stringify(migrateProject(oldProject)));
  expect(newProject).toEqual({
    _version: LATEST_LEGACY_PROJECT_VERSION,
    _release: LATEST_LEGACY_PROJECT_MINOR_VERSION,
    settings: {
      colorMode: "mono",
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
        symbol: "scene_1",
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
    variables: [],
  });
});

test("should add missing settings when migrating to latest release", () => {
  const oldProject = {
    _version: "1.2.0",
    settings: {},
    scenes: [],
    backgrounds: [],
    spriteSheets: [],
    variables: [],
  };
  const newProject = migrateLegacyProject(oldProject);
  expect(newProject).toMatchObject({
    settings: {
      favoriteEvents: ["EVENT_TEXT", "EVENT_SWITCH_SCENE"],
    },
  });
});
