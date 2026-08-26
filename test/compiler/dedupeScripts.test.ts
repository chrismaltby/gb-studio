import compile from "../../src/lib/compiler/compileData";
import { EVENT_TEXT } from "../../src/consts";
import { getTestScriptHandlers } from "../getTestScriptHandlers";
import { ProjectResources, ScriptEvent } from "shared/lib/resources/types";
import os from "os";

const buildProject = ({
  sceneAScript = [],
  sceneBScript = [],
  sceneAActors = [],
  sceneBActors = [],
  sceneATriggers = [],
  sceneBTriggers = [],
  actorPrefabs = [],
}: {
  sceneAScript?: Partial<ScriptEvent>[];
  sceneBScript?: Partial<ScriptEvent>[];
  sceneAActors?: Record<string, unknown>[];
  sceneBActors?: Record<string, unknown>[];
  sceneATriggers?: Record<string, unknown>[];
  sceneBTriggers?: Record<string, unknown>[];
  actorPrefabs?: Record<string, unknown>[];
}) =>
  ({
    startSceneId: "1",
    startX: 5,
    startY: 6,
    startDirection: "down",
    settings: {
      playerSpriteSheetId: "SPRITE_1",
      defaultPlayerSprites: {
        TOPDOWN: "SPRITE_1",
      },
    },
    scenes: [
      {
        id: "1",
        name: "first_scene",
        symbol: "scene_a",
        backgroundId: "2",
        width: 20,
        height: 18,
        type: "TOPDOWN",
        collisions: [],
        actors: sceneAActors,
        triggers: sceneATriggers,
        script: sceneAScript,
        playerHit1Script: [],
        playerHit2Script: [],
        playerHit3Script: [],
      },
      {
        id: "5",
        name: "second_scene",
        symbol: "scene_b",
        backgroundId: "3",
        width: 20,
        height: 18,
        type: "TOPDOWN",
        collisions: [],
        actors: sceneBActors,
        triggers: sceneBTriggers,
        script: sceneBScript,
        playerHit1Script: [],
        playerHit2Script: [],
        playerHit3Script: [],
      },
    ],
    backgrounds: [
      {
        id: "2",
        symbol: "bg_1",
        width: 20,
        height: 32,
        imageWidth: 160,
        imageHeight: 256,
        filename: "forest_clearing.png",
      },
      {
        id: "3",
        symbol: "bg_2",
        width: 20,
        height: 18,
        imageWidth: 160,
        imageHeight: 256,
        filename: "mabe_house.png",
      },
    ],
    sprites: [
      {
        id: "SPRITE_1",
        symbol: "sprite_1",
        filename: "sprite_1.png",
        states: [
          {
            id: "SPRITE_STATE_1",
            name: "",
            animations: [
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
              { frames: [] },
            ],
          },
        ],
      },
    ],
    music: [],
    fonts: [
      {
        id: "font1",
        symbol: "font_1",
        filename: "gbs-mono.png",
      },
    ],
    palettes: [],
    avatars: [],
    emotes: [],
    actorPrefabs,
    triggerPrefabs: [],
    variables: {
      variables: [],
      constants: [],
    },
    engineFieldValues: {
      engineFieldValues: [],
    },
  }) as unknown as ProjectResources;

const compileProject = async (
  project: ProjectResources,
  debugEnabled = false,
) => {
  const scriptEventHandlers = await getTestScriptHandlers();
  return compile(project, {
    projectRoot: `${__dirname}/_files`,
    scriptEventHandlers,
    engineSchema: {
      fields: [],
      sceneTypes: [
        {
          key: "TOPDOWN",
          label: "GAMETYPE_TOP_DOWN",
        },
      ],
      consts: {},
    },
    tmpPath: os.tmpdir(),
    debugEnabled,
    progress: (_msg: string) => {},
    warnings: (_msg: string) => {},
  });
};

let nextEventId = 1;
const textEvent = (text: string) => ({
  id: `event_${nextEventId++}`,
  command: EVENT_TEXT,
  args: {
    text,
  },
});

test("should reuse identical trigger scripts across scenes", async () => {
  const project = buildProject({
    sceneATriggers: [
      {
        id: "92",
        symbol: "trigger_a",
        x: 1,
        y: 2,
        width: 5,
        height: 1,
        trigger: "walk",
        script: [textEvent("TRIGGER TEST")],
        leaveScript: [],
      },
    ],
    sceneBTriggers: [
      {
        id: "91",
        symbol: "trigger_b",
        x: 1,
        y: 2,
        width: 5,
        height: 1,
        trigger: "walk",
        script: [textEvent("TRIGGER TEST")],
        leaveScript: [],
      },
    ],
  });
  const compiled = await compileProject(project);
  // First trigger's script compiled as normal
  expect(compiled.files["trigger_a_interact.s"]).toBeDefined();
  // Identical second trigger script merged into first rather than duplicated
  expect(compiled.files["trigger_b_interact.s"]).toBeUndefined();
  // Second scene's trigger data points at the shared script
  expect(compiled.files["scene_b_triggers.c"]).toContain("trigger_a_interact");
  expect(compiled.files["scene_b_triggers.c"]).not.toContain(
    "trigger_b_interact",
  );
});

test("should reuse identical actor scripts across scenes", async () => {
  const project = buildProject({
    sceneAActors: [
      {
        id: "9",
        symbol: "actor_a",
        spriteSheetId: "SPRITE_1",
        script: [textEvent("ACTOR TEST")],
      },
    ],
    sceneBActors: [
      {
        id: "10",
        symbol: "actor_b",
        spriteSheetId: "SPRITE_1",
        script: [textEvent("ACTOR TEST")],
      },
    ],
  });
  const compiled = await compileProject(project);
  expect(compiled.files["actor_a_interact.s"]).toBeDefined();
  expect(compiled.files["actor_b_interact.s"]).toBeUndefined();
  expect(compiled.files["scene_b_actors.c"]).toContain("actor_a_interact");
  expect(compiled.files["scene_b_actors.c"]).not.toContain("actor_b_interact");
});

test("should not merge scripts that compile differently due to Self references", async () => {
  const selfHideScript = [
    {
      id: "event_self_hide",
      command: "EVENT_ACTOR_HIDE",
      args: {
        actorId: "$self$",
      },
    },
  ];
  const project = buildProject({
    sceneAActors: [
      {
        id: "9",
        symbol: "actor_a",
        spriteSheetId: "SPRITE_1",
        script: selfHideScript,
      },
      {
        id: "10",
        symbol: "actor_b",
        spriteSheetId: "SPRITE_1",
        script: selfHideScript,
      },
    ],
  });
  const compiled = await compileProject(project);
  // Identical JSON but Self resolves to different actor indexes
  // so compiled output differs and scripts must NOT be merged
  expect(compiled.files["actor_a_interact.s"]).toBeDefined();
  expect(compiled.files["actor_b_interact.s"]).toBeDefined();
  expect(compiled.files["actor_a_interact.s"]).not.toEqual(
    compiled.files["actor_b_interact.s"],
  );
});

test("should reuse identical scripts from the same actor prefab", async () => {
  const project = buildProject({
    actorPrefabs: [
      {
        id: "prefab_1",
        _resourceType: "actorPrefab",
        name: "Prefab",
        spriteSheetId: "SPRITE_1",
        script: [textEvent("PREFAB TEST")],
        startScript: [],
        updateScript: [],
        hit1Script: [],
        hit2Script: [],
        hit3Script: [],
      },
    ],
    sceneAActors: [
      {
        id: "9",
        symbol: "actor_a",
        prefabId: "prefab_1",
        prefabScriptOverrides: {},
      },
      {
        id: "10",
        symbol: "actor_b",
        prefabId: "prefab_1",
        prefabScriptOverrides: {},
      },
    ],
  });
  const compiled = await compileProject(project);
  expect(compiled.files["actor_a_interact.s"]).toBeDefined();
  expect(compiled.files["actor_b_interact.s"]).toBeUndefined();
  expect(compiled.files["scene_a_actors.c"]).toContain("actor_a_interact");
  expect(compiled.files["scene_a_actors.c"]).not.toContain("actor_b_interact");
});

test("should not merge actor prefab scripts with different actor indexes", async () => {
  const selfHideScript = [
    {
      id: "event_self_hide",
      command: "EVENT_ACTOR_HIDE",
      args: {
        actorId: "$self$",
      },
    },
  ];
  const project = buildProject({
    actorPrefabs: [
      {
        id: "prefab_1",
        _resourceType: "actorPrefab",
        name: "Prefab",
        spriteSheetId: "SPRITE_1",
        script: selfHideScript,
        startScript: [],
        updateScript: [],
        hit1Script: [],
        hit2Script: [],
        hit3Script: [],
      },
    ],
    sceneAActors: [
      {
        id: "9",
        symbol: "actor_a",
        prefabId: "prefab_1",
        prefabScriptOverrides: {},
      },
      {
        id: "10",
        symbol: "actor_b",
        prefabId: "prefab_1",
        prefabScriptOverrides: {},
      },
    ],
  });
  const compiled = await compileProject(project);
  expect(compiled.files["actor_a_interact.s"]).toBeDefined();
  expect(compiled.files["actor_b_interact.s"]).toBeDefined();
  expect(compiled.files["actor_a_interact.s"]).not.toEqual(
    compiled.files["actor_b_interact.s"],
  );
});

test("should reuse actor prefab scripts with matching actor indexes across scenes", async () => {
  const selfHideScript = [
    {
      id: "event_self_hide",
      command: "EVENT_ACTOR_HIDE",
      args: {
        actorId: "$self$",
      },
    },
  ];
  const project = buildProject({
    actorPrefabs: [
      {
        id: "prefab_1",
        _resourceType: "actorPrefab",
        name: "Prefab",
        spriteSheetId: "SPRITE_1",
        script: selfHideScript,
        startScript: [],
        updateScript: [],
        hit1Script: [],
        hit2Script: [],
        hit3Script: [],
      },
    ],
    sceneAActors: [
      {
        id: "9",
        symbol: "actor_a",
        prefabId: "prefab_1",
        prefabScriptOverrides: {},
      },
    ],
    sceneBActors: [
      {
        id: "10",
        symbol: "actor_b",
        prefabId: "prefab_1",
        prefabScriptOverrides: {},
      },
    ],
  });
  const compiled = await compileProject(project);
  expect(compiled.files["actor_a_interact.s"]).toBeDefined();
  expect(compiled.files["actor_b_interact.s"]).toBeUndefined();
  expect(compiled.files["scene_b_actors.c"]).toContain("actor_a_interact");
  expect(compiled.files["scene_b_actors.c"]).not.toContain("actor_b_interact");
});

test("should not dedupe in debug builds to prevent issues with debugger and breakpoints", async () => {
  const project = buildProject({
    sceneATriggers: [
      {
        id: "92",
        symbol: "trigger_a",
        x: 1,
        y: 2,
        width: 5,
        height: 1,
        trigger: "walk",
        script: [textEvent("TRIGGER TEST")],
        leaveScript: [],
      },
    ],
    sceneBTriggers: [
      {
        id: "91",
        symbol: "trigger_b",
        x: 1,
        y: 2,
        width: 5,
        height: 1,
        trigger: "walk",
        script: [textEvent("TRIGGER TEST")],
        leaveScript: [],
      },
    ],
  });
  const compiled = await compileProject(project, true);
  expect(compiled.files["trigger_a_interact.s"]).toBeDefined();
  expect(compiled.files["trigger_b_interact.s"]).toBeDefined();
  expect(compiled.files["scene_b_triggers.c"]).toContain("trigger_b_interact");
  expect(compiled.files["scene_b_triggers.c"]).not.toContain(
    "trigger_a_interact",
  );
});
