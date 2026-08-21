import { precompileScriptValue } from "shared/lib/scriptValue/helpers";
import { PrecompiledScene } from "../../src/lib/compiler/generateGBVMData";
import ScriptBuilder from "../../src/lib/compiler/scriptBuilder/scriptBuilder";
import ScriptBuilderBase from "../../src/lib/compiler/scriptBuilder/scriptBuilderBase";
import {
  ScriptBuilderOptions,
  ScriptBuilderVariable,
} from "../../src/lib/compiler/scriptBuilder/types";
import {
  dummyActorNormalized,
  dummyEngineFieldSchema,
  dummyPrecompiledBackground,
  dummyPrecompiledSpriteSheet,
  dummyTilesetResource,
  getDummyCompiledFont,
} from "../dummydata";
import { getTestScriptHandlers } from "../getTestScriptHandlers";
import { Script, ScriptEvent } from "shared/lib/resources/types";
import { DeprecatedAPI } from "lib/compiler/scriptBuilder/deprecatedAPI";

const createTestScriptBuilder = async (
  sceneOverrides: Record<string, unknown> = {},
  optionsOverrides: Partial<ScriptBuilderOptions> = {},
) => {
  const output: string[] = [];
  const scriptEventHandlers = await getTestScriptHandlers();

  const defaultScene = {
    id: "scene1",
    name: "Scene 1",
    symbol: "scene_1",
    width: 20,
    height: 18,
    background: dummyPrecompiledBackground,
    playerSprite: dummyPrecompiledSpriteSheet,
    sprites: [],
    parallax: [],
    actorsExclusiveLookup: {},
    type: "TOPDOWN",
    actors: [],
    triggers: [],
    projectiles: [],
    ...sceneOverrides,
  } as unknown as PrecompiledScene;

  const defaultOptions: Partial<ScriptBuilderOptions> = {
    scriptEventHandlers,
    scene: defaultScene,
    ...optionsOverrides,
  };

  const sb = new ScriptBuilder(output, defaultOptions as ScriptBuilderOptions);

  return { sb, output };
};

test("Should be able to set active actor to player", async () => {
  const output: string[] = [];
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    scene: {
      id: "scene1",
      name: "Scene 1",
      symbol: "scene_1",
      width: 20,
      height: 18,
      background: dummyPrecompiledBackground,
      playerSprite: dummyPrecompiledSpriteSheet,
      sprites: [],
      parallax: [],
      actorsExclusiveLookup: {},
      type: "TOPDOWN",
      actors: [{ ...dummyActorNormalized, id: "actor1" }],
      triggers: [],
      projectiles: [],
    } as unknown as PrecompiledScene,
    entity: {
      id: "actor1",
      name: "Actor 1",
    },
  });
  sb.actorSetActive("player");
  expect(output).toEqual([
    "        ; Actor Set Active",
    "        VM_SET_CONST            .LOCAL_ACTOR, 0",
    "",
  ]);
});

test("Should be able to set active actor to actor by id", async () => {
  const output: string[] = [];
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    scene: {
      id: "scene1",
      name: "Scene 1",
      symbol: "scene_1",
      width: 20,
      height: 18,
      background: dummyPrecompiledBackground,
      playerSprite: dummyPrecompiledSpriteSheet,
      sprites: [],
      parallax: [],
      actorsExclusiveLookup: {},
      type: "TOPDOWN",
      actors: [
        { ...dummyActorNormalized, id: "actor1" },
        { ...dummyActorNormalized, id: "actor2" },
      ],
      triggers: [],
      projectiles: [],
    } as unknown as PrecompiledScene,
  });
  sb.actorSetActive("actor2");
  expect(output).toEqual([
    "        ; Actor Set Active",
    "        VM_SET_CONST            .LOCAL_ACTOR, 2",
    "",
  ]);
});

test("Should be able to move actor to new location", async () => {
  const output: string[] = [];
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    scene: {
      id: "scene1",
      name: "Scene 1",
      symbol: "scene_1",
      width: 20,
      height: 18,
      background: dummyPrecompiledBackground,
      playerSprite: dummyPrecompiledSpriteSheet,
      sprites: [],
      parallax: [],
      actorsExclusiveLookup: {},
      type: "TOPDOWN",
      actors: [],
      triggers: [],
      projectiles: [],
    } as unknown as PrecompiledScene,
  });
  (sb as unknown as DeprecatedAPI).actorMoveTo(5, 6, true, "horizontal");
  expect(output).toEqual([
    "        ; Actor Move To",
    "        VM_SET_CONST            ^/(.LOCAL_ACTOR + 1)/, 1280",
    "        VM_SET_CONST            ^/(.LOCAL_ACTOR + 2)/, 1536",
    "        VM_SET_CONST            ^/(.LOCAL_ACTOR + 3)/, ^/(.ACTOR_ATTR_CHECK_COLL | .ACTOR_ATTR_H_FIRST)/",
    "        VM_ACTOR_MOVE_TO        .LOCAL_ACTOR",
    "",
  ]);
});

test("Should be able to wait for N frames to pass", async () => {
  const output: string[] = [];
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    scene: {
      id: "scene1",
      name: "Scene 1",
      symbol: "scene_1",
      width: 20,
      height: 18,
      background: dummyPrecompiledBackground,
      playerSprite: dummyPrecompiledSpriteSheet,
      sprites: [],
      parallax: [],
      actorsExclusiveLookup: {},
      type: "TOPDOWN",
      actors: [],
      triggers: [],
      projectiles: [],
    } as unknown as PrecompiledScene,
  });
  (sb as unknown as DeprecatedAPI).wait(20);
  expect(output).toEqual([
    "        ; Wait 20 Frames",
    "        VM_SET_CONST            .LOCAL_TMP0_WAIT_ARGS, 20",
    "        VM_INVOKE               b_wait_frames, _wait_frames, 0, .LOCAL_TMP0_WAIT_ARGS",
    "",
  ]);
});

test("Should be able to generate script string", async () => {
  const output: string[] = [];
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    scene: {
      id: "scene1",
      name: "Scene 1",
      symbol: "scene_1",
      width: 20,
      height: 18,
      background: dummyPrecompiledBackground,
      playerSprite: dummyPrecompiledSpriteSheet,
      sprites: [],
      parallax: [],
      actorsExclusiveLookup: {},
      type: "TOPDOWN",
      actors: [
        {
          ...dummyActorNormalized,
          id: "actor1",
        },
        {
          ...dummyActorNormalized,
          id: "actor2",
        },
      ],
      triggers: [],
      projectiles: [],
    } as unknown as PrecompiledScene,
  });
  sb.actorSetActive("actor2");
  (sb as unknown as DeprecatedAPI).actorMoveTo(5, 6, true, "horizontal");
  sb._packLocals();
  expect(sb.toScriptString("MY_SCRIPT", false)).toEqual(
    `.module MY_SCRIPT

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255

.LOCAL_ACTOR = -4

___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

_MY_SCRIPT::
        VM_RESERVE              4

        ; Actor Set Active
        VM_SET_CONST            .LOCAL_ACTOR, 2

        ; Actor Move To
        VM_SET_CONST            ^/(.LOCAL_ACTOR + 1)/, 1280
        VM_SET_CONST            ^/(.LOCAL_ACTOR + 2)/, 1536
        VM_SET_CONST            ^/(.LOCAL_ACTOR + 3)/, ^/(.ACTOR_ATTR_CHECK_COLL | .ACTOR_ATTR_H_FIRST)/
        VM_ACTOR_MOVE_TO        .LOCAL_ACTOR

`,
  );
});

test("Should be able to open dialogue boxes", async () => {
  const dummyCompiledFont = await getDummyCompiledFont();
  const output: string[] = [];
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    scene: {
      id: "scene1",
      name: "Scene 1",
      symbol: "scene_1",
      width: 20,
      height: 18,
      background: dummyPrecompiledBackground,
      playerSprite: dummyPrecompiledSpriteSheet,
      sprites: [],
      parallax: [],
      actorsExclusiveLookup: {},
      type: "TOPDOWN",
      actors: [],
      triggers: [],
      projectiles: [],
    } as unknown as PrecompiledScene,
    fonts: [dummyCompiledFont],
  });
  sb.textDialogue("Hello World");
  sb.scriptEnd();

  expect(sb.toScriptString("MY_SCRIPT", false)).toEqual(
    `.module MY_SCRIPT

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255


___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

_MY_SCRIPT::
        ; Text Dialogue
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_SPEED_INSTANT
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_OVERLAY_SET_SCROLL   1, 1, 18, 5, .UI_COLOR_WHITE
        VM_SWITCH_TEXT_LAYER    .TEXT_LAYER_WIN
        VM_LOAD_TEXT            0
        .asciz "Hello World"
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        ; Stop Script
        VM_STOP
`,
  );
});

test("Should be able to wait mid-text in dialogue boxes", async () => {
  const dummyCompiledFont = await getDummyCompiledFont();
  const output: string[] = [];
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    scene: {
      id: "scene1",
      name: "Scene 1",
      symbol: "scene_1",
      width: 20,
      height: 18,
      background: dummyPrecompiledBackground,
      playerSprite: dummyPrecompiledSpriteSheet,
      sprites: [],
      parallax: [],
      actorsExclusiveLookup: {},
      type: "TOPDOWN",
      actors: [],
      triggers: [],
      projectiles: [],
    } as unknown as PrecompiledScene,
    fonts: [dummyCompiledFont],
  });
  sb.textDialogue("Hello!W:5f!World");
  sb.scriptEnd();
  sb._packLocals();

  expect(sb.toScriptString("MY_SCRIPT", false)).toEqual(
    `.module MY_SCRIPT

.include "vm.i"
.include "data/game_globals.i"

.globl b_wait_frames, _wait_frames

.area _CODE_255

.LOCAL_TMP0_WAIT_ARGS = -1

___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

_MY_SCRIPT::
        VM_RESERVE              1

        ; Text Dialogue
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_SPEED_INSTANT
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_OVERLAY_SET_SCROLL   1, 1, 18, 5, .UI_COLOR_WHITE
        VM_SWITCH_TEXT_LAYER    .TEXT_LAYER_WIN
        VM_LOAD_TEXT            0
        .asciz "Hello"
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, .UI_WAIT_TEXT
        VM_SET_CONST            .LOCAL_TMP0_WAIT_ARGS, 5
        VM_INVOKE               b_wait_frames, _wait_frames, 0, .LOCAL_TMP0_WAIT_ARGS
        VM_LOAD_TEXT            0
        .asciz "World"
        VM_DISPLAY_TEXT_EX      .DISPLAY_PRESERVE_POS, .TEXT_TILE_CONTINUE
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        ; Stop Script
        VM_STOP
`,
  );
});

test("Should be able to conditionally execute if variable is true with event array paths", async () => {
  const output: string[] = [];
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    scene: {
      id: "scene1",
      name: "Scene 1",
      symbol: "scene_1",
      width: 20,
      height: 18,
      background: dummyPrecompiledBackground,
      playerSprite: dummyPrecompiledSpriteSheet,
      sprites: [],
      parallax: [],
      actorsExclusiveLookup: {},
      type: "TOPDOWN",
      actors: [],
      triggers: [],
      projectiles: [],
    } as unknown as PrecompiledScene,
    // variables: ["0", "1"],
    compileEvents: (self: ScriptBuilderBase, events: ScriptEvent[]) => {
      if (events[0]?.id === "event1") {
        output.push("        VM_DEBUG                0");
        output.push('        .asciz "True Path"');
      } else {
        output.push("        VM_DEBUG                0");
        output.push('        .asciz "False Path"');
      }
    },
  });
  (sb as unknown as DeprecatedAPI).ifVariableTrue(
    "1",
    [
      {
        id: "event1",
        command: "DUMMY1",
        args: {},
      },
    ],
    [
      {
        id: "event2",
        command: "DUMMY2",
        args: {},
      },
    ],
  );
  expect(sb.toScriptString("MY_SCRIPT", false)).toEqual(
    `.module MY_SCRIPT

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255


___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

_MY_SCRIPT::
        ; If Variable True
        VM_IF_CONST             .GT, VAR_VARIABLE_1, 0, 1$, 0
        VM_DEBUG                0
        .asciz "False Path"
        VM_JUMP                 2$
1$:
        VM_DEBUG                0
        .asciz "True Path"
2$:

`,
  );
});

test("Should be able to conditionally execute if variable is true with function paths", async () => {
  const dummyCompiledFont = await getDummyCompiledFont();
  const output: string[] = [];
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    scene: {
      id: "scene1",
      name: "Scene 1",
      symbol: "scene_1",
      width: 20,
      height: 18,
      background: dummyPrecompiledBackground,
      playerSprite: dummyPrecompiledSpriteSheet,
      sprites: [],
      parallax: [],
      actorsExclusiveLookup: {},
      type: "TOPDOWN",
      actors: [
        {
          ...dummyActorNormalized,
          id: "actor1",
        },
        {
          ...dummyActorNormalized,
          id: "actor2",
        },
      ],
      triggers: [],
      projectiles: [],
    } as unknown as PrecompiledScene,
    fonts: [dummyCompiledFont],
    // variables: ["0", "1"],
    compileEvents: (self: ScriptBuilderBase, events: ScriptEvent[]) => {
      if (events[0]?.id === "event1") {
        output.push("        VM_DEBUG        0");
        output.push('        .asciz "True Path"');
      } else {
        output.push("        VM_DEBUG        0");
        output.push('        .asciz "False Path"');
      }
    },
  });
  (sb as unknown as DeprecatedAPI).ifVariableTrue(
    "0",
    () => sb.textDialogue("Hello World"),
    () => sb.textDialogue("Goodbye World"),
  );
  sb.scriptEnd();

  expect(sb.toScriptString("MY_SCRIPT", false)).toEqual(
    `.module MY_SCRIPT

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255


___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

_MY_SCRIPT::
        ; If Variable True
        VM_IF_CONST             .GT, VAR_VARIABLE_0, 0, 1$, 0
        ; Text Dialogue
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_SPEED_INSTANT
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_OVERLAY_SET_SCROLL   1, 1, 18, 5, .UI_COLOR_WHITE
        VM_SWITCH_TEXT_LAYER    .TEXT_LAYER_WIN
        VM_LOAD_TEXT            0
        .asciz "Goodbye World"
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        VM_JUMP                 2$
1$:
        ; Text Dialogue
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_SPEED_INSTANT
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_OVERLAY_SET_SCROLL   1, 1, 18, 5, .UI_COLOR_WHITE
        VM_SWITCH_TEXT_LAYER    .TEXT_LAYER_WIN
        VM_LOAD_TEXT            0
        .asciz "Hello World"
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

2$:

        ; Stop Script
        VM_STOP
`,
  );
});

test("Should be able to conditionally execute if variable is true with nested function paths", async () => {
  const dummyCompiledFont = await getDummyCompiledFont();
  const output: string[] = [];
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    scene: {
      id: "scene1",
      name: "Scene 1",
      symbol: "scene_1",
      width: 20,
      height: 18,
      background: dummyPrecompiledBackground,
      playerSprite: dummyPrecompiledSpriteSheet,
      sprites: [],
      parallax: [],
      actorsExclusiveLookup: {},
      type: "TOPDOWN",
      actors: [
        { ...dummyActorNormalized, id: "actor1" },
        { ...dummyActorNormalized, id: "actor2" },
        { ...dummyActorNormalized, id: "actor3" },
        { ...dummyActorNormalized, id: "actor4" },
      ],
      triggers: [],
      projectiles: [],
    } as unknown as PrecompiledScene,
    fonts: [dummyCompiledFont],
    // variables: ["0", "1", "2"],
  });

  (sb as unknown as DeprecatedAPI).ifVariableTrue(
    "0",
    // 0 == True
    () =>
      (sb as unknown as DeprecatedAPI).ifVariableTrue(
        "1",
        () => sb.textDialogue("0=TRUE 1=TRUE"), // 1 == True
        () => sb.textDialogue("0=TRUE 1=FALSE"), // 1 == False
      ),
    // 0 == False
    () =>
      (sb as unknown as DeprecatedAPI).ifVariableTrue(
        "2",
        () => sb.textDialogue("0=FALSE 2=TRUE"), // 2 == True
        () => sb.textDialogue("0=FALSE 2=FALSE"), // 2 == False
      ),
  );
  sb.scriptEnd();

  expect(sb.toScriptString("MY_SCRIPT", false)).toEqual(
    `.module MY_SCRIPT

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255


___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

_MY_SCRIPT::
        ; If Variable True
        VM_IF_CONST             .GT, VAR_VARIABLE_0, 0, 1$, 0
        ; If Variable True
        VM_IF_CONST             .GT, VAR_VARIABLE_2, 0, 3$, 0
        ; Text Dialogue
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_SPEED_INSTANT
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_OVERLAY_SET_SCROLL   1, 1, 18, 5, .UI_COLOR_WHITE
        VM_SWITCH_TEXT_LAYER    .TEXT_LAYER_WIN
        VM_LOAD_TEXT            0
        .asciz "0=FALSE 2=FALSE"
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        VM_JUMP                 4$
3$:
        ; Text Dialogue
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_SPEED_INSTANT
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_OVERLAY_SET_SCROLL   1, 1, 18, 5, .UI_COLOR_WHITE
        VM_SWITCH_TEXT_LAYER    .TEXT_LAYER_WIN
        VM_LOAD_TEXT            0
        .asciz "0=FALSE 2=TRUE"
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

4$:

        VM_JUMP                 2$
1$:
        ; If Variable True
        VM_IF_CONST             .GT, VAR_VARIABLE_1, 0, 5$, 0
        ; Text Dialogue
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_SPEED_INSTANT
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_OVERLAY_SET_SCROLL   1, 1, 18, 5, .UI_COLOR_WHITE
        VM_SWITCH_TEXT_LAYER    .TEXT_LAYER_WIN
        VM_LOAD_TEXT            0
        .asciz "0=TRUE 1=FALSE"
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        VM_JUMP                 6$
5$:
        ; Text Dialogue
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_SPEED_INSTANT
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_OVERLAY_SET_SCROLL   1, 1, 18, 5, .UI_COLOR_WHITE
        VM_SWITCH_TEXT_LAYER    .TEXT_LAYER_WIN
        VM_LOAD_TEXT            0
        .asciz "0=TRUE 1=TRUE"
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

6$:

2$:

        ; Stop Script
        VM_STOP
`,
  );
});

test("Should be able to define labels and jump", async () => {
  const output: string[] = [];
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    scene: {
      id: "scene1",
      name: "Scene 1",
      symbol: "scene_1",
      width: 20,
      height: 18,
      background: dummyPrecompiledBackground,
      playerSprite: dummyPrecompiledSpriteSheet,
      sprites: [],
      parallax: [],
      actorsExclusiveLookup: {},
      type: "TOPDOWN",
      actors: [],
      triggers: [],
      projectiles: [],
    } as unknown as PrecompiledScene,
  });
  sb.labelDefine("mylabel");
  sb.labelGoto("mylabel");

  expect(sb.toScriptString("MY_SCRIPT", false)).toEqual(
    `.module MY_SCRIPT

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255


___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

_MY_SCRIPT::
1$:
        VM_JUMP                 1$
`,
  );
});

test("Should throw if jump to label is not stack neutral", async () => {
  const output: string[] = [];
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    scene: {
      id: "scene1",
      name: "Scene 1",
      symbol: "scene_1",
      width: 20,
      height: 18,
      background: dummyPrecompiledBackground,
      playerSprite: dummyPrecompiledSpriteSheet,
      sprites: [],
      parallax: [],
      actorsExclusiveLookup: {},
      type: "TOPDOWN",
      actors: [{ ...dummyActorNormalized, id: "actor1" }],
      triggers: [],
      projectiles: [],
    } as unknown as PrecompiledScene,
    entity: {
      id: "actor1",
      name: "Actor 1",
    },
  });
  sb._stackPush(5);
  sb._label("abc");
  sb._stackPop(1);
  expect(() => sb._jump("abc")).toThrow();
});

test("Should be able to set an actor's state with looping animation", async () => {
  const output: string[] = [];
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    scene: {
      id: "scene1",
      name: "Scene 1",
      symbol: "scene_1",
      width: 20,
      height: 18,
      background: dummyPrecompiledBackground,
      playerSprite: dummyPrecompiledSpriteSheet,
      sprites: [],
      parallax: [],
      actorsExclusiveLookup: {},
      type: "TOPDOWN",
      actors: [{ ...dummyActorNormalized, id: "actor1" }],
      triggers: [],
      projectiles: [],
    } as unknown as PrecompiledScene,
    entity: {
      id: "actor1",
      name: "Actor 1",
    },
    statesOrder: ["", "state1", "state2"],
    stateReferences: ["STATE_DEFAULT", "STATE_1", "STATE_2"],
  });
  sb.actorSetActive("actor1");
  sb.actorSetState("state1", true);
  expect(output).toEqual([
    "        ; Actor Set Active",
    "        VM_SET_CONST            .LOCAL_ACTOR, 1",
    "",
    "        ; Actor Set Animation State",
    "        VM_ACTOR_SET_ANIM_SET   .LOCAL_ACTOR, STATE_1",
    "        VM_ACTOR_SET_FLAGS      .LOCAL_ACTOR, 0, .ACTOR_FLAG_ANIM_NOLOOP",
    "",
  ]);
});

test("Should be able to set an actor's state with one-shot animation", async () => {
  const output: string[] = [];
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    scene: {
      id: "scene1",
      name: "Scene 1",
      symbol: "scene_1",
      width: 20,
      height: 18,
      background: dummyPrecompiledBackground,
      playerSprite: dummyPrecompiledSpriteSheet,
      sprites: [],
      parallax: [],
      actorsExclusiveLookup: {},
      type: "TOPDOWN",
      actors: [{ ...dummyActorNormalized, id: "actor1" }],
      triggers: [],
      projectiles: [],
    } as unknown as PrecompiledScene,
    entity: {
      id: "actor1",
      name: "Actor 1",
    },
    statesOrder: ["", "state1", "state2"],
    stateReferences: ["STATE_DEFAULT", "STATE_1", "STATE_2"],
  });
  sb.actorSetActive("actor1");
  sb.actorSetState("state1", false);
  expect(output).toEqual([
    "        ; Actor Set Active",
    "        VM_SET_CONST            .LOCAL_ACTOR, 1",
    "",
    "        ; Actor Set Animation State",
    "        VM_ACTOR_SET_ANIM_SET   .LOCAL_ACTOR, STATE_1",
    "        VM_ACTOR_SET_FLAGS      .LOCAL_ACTOR, .ACTOR_FLAG_ANIM_NOLOOP, .ACTOR_FLAG_ANIM_NOLOOP",
    "",
  ]);
});

test("Should default actor's state to use looping animation if loop value not provided", async () => {
  const output: string[] = [];
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    scene: {
      id: "scene1",
      name: "Scene 1",
      symbol: "scene_1",
      width: 20,
      height: 18,
      background: dummyPrecompiledBackground,
      playerSprite: dummyPrecompiledSpriteSheet,
      sprites: [],
      parallax: [],
      actorsExclusiveLookup: {},
      type: "TOPDOWN",
      actors: [{ ...dummyActorNormalized, id: "actor1" }],
      triggers: [],
      projectiles: [],
    } as unknown as PrecompiledScene,
    entity: {
      id: "actor1",
      name: "Actor 1",
    },
    statesOrder: ["", "state1", "state2"],
    stateReferences: ["STATE_DEFAULT", "STATE_1", "STATE_2"],
  });
  sb.actorSetActive("actor1");
  sb.actorSetState("state1");
  expect(output).toEqual([
    "        ; Actor Set Active",
    "        VM_SET_CONST            .LOCAL_ACTOR, 1",
    "",
    "        ; Actor Set Animation State",
    "        VM_ACTOR_SET_ANIM_SET   .LOCAL_ACTOR, STATE_1",
    "        VM_ACTOR_SET_FLAGS      .LOCAL_ACTOR, 0, .ACTOR_FLAG_ANIM_NOLOOP",
    "",
  ]);
});

test("Should get variable alias for named variable", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    variablesLookup: {
      "10": {
        id: "10",
        name: "foobar",
        symbol: "var_foobar",
      },
    },
  } as unknown as ScriptBuilderOptions);
  expect(sb.getVariableAlias("10")).toEqual("VAR_FOOBAR");
});

test("Should get default alias for unnamed variable", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    variablesLookup: {},
  } as unknown as ScriptBuilderOptions);
  expect(sb.getVariableAlias("11")).toEqual("VAR_VARIABLE_11");
});

test("Should get default alias for variable with empty name", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    variablesLookup: {
      "13": {
        id: "13",
        name: "",
        symbol: "",
      },
    },
  } as unknown as ScriptBuilderOptions);
  expect(sb.getVariableAlias("13")).toEqual("VAR_VARIABLE_13");
});

test("Should reject a missing UUID variable without exposing its id", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    variablesLookup: {},
  } as unknown as ScriptBuilderOptions);
  expect(() =>
    sb.getVariableAlias("abcdef01-2345-6789-abcd-ef0123456789"),
  ).toThrow("Cannot find referenced variable");
});

test("Should make UUID variables in expressions human readable", async () => {
  const scalarId = "11111111-1111-1111-1111-111111111111";
  const { sb } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        [scalarId]: {
          id: scalarId,
          name: "Score",
          symbol: "var_score",
          type: "number",
        },
      },
    },
  );

  expect(sb._expressionToHumanReadable(`$${scalarId}$ + 1`)).toBe(
    "VAR_SCORE+1",
  );
});

test("Should make statically and dynamically indexed arrays human readable", async () => {
  const arrayId = "11111111-1111-1111-1111-111111111111";
  const indexId = "22222222-2222-2222-2222-222222222222";
  const { sb } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        [arrayId]: {
          id: arrayId,
          name: "Values",
          symbol: "var_values",
          type: "array",
          length: 4,
        },
        [indexId]: {
          id: indexId,
          name: "Index",
          symbol: "var_index",
          type: "number",
        },
      },
    },
  );

  expect(
    sb._expressionToHumanReadable(
      `$${arrayId}$[2] + $${arrayId}$[$${indexId}$ + 1]`,
    ),
  ).toBe("VAR_VALUES[2]+VAR_VALUES[VAR_INDEX+1]");
});

test("Should make expression destinations and engine constants human readable", async () => {
  const destination = {
    type: "argument" as const,
    indirect: true,
    symbol: ".SCRIPT_ARG_INDIRECT_3_VARIABLE",
  };
  const { sb, output } = await createTestScriptBuilder();

  sb.variableEvaluateExpression(destination, "@engine::ADVENTURE_BLANK_STATE@");

  expect(output[0]).toBe(
    "        ; Variable .SCRIPT_ARG_INDIRECT_3_VARIABLE = ADVENTURE_BLANK_STATE",
  );
});

describe("ScriptBuilderVariable values", () => {
  const arrayId = "11111111-1111-1111-1111-111111111111";
  const indexId = "22222222-2222-2222-2222-222222222222";
  const directArg = {
    type: "argument" as const,
    indirect: false,
    symbol: ".SCRIPT_ARG_0_VARIABLE",
  };
  const indirectArg = {
    type: "argument" as const,
    indirect: true,
    symbol: ".SCRIPT_ARG_INDIRECT_1_VARIABLE",
  };
  const arrayArg = {
    type: "argument" as const,
    indirect: true,
    array: true,
    symbol: ".SCRIPT_ARG_INDIRECT_2_VARIABLE",
  };

  const cases: {
    name: string;
    variable: ScriptBuilderVariable;
    address: string;
    indirect: boolean;
    expectedSetup?: string[];
  }[] = [
    {
      name: "string variable ID",
      variable: "0",
      address: "VAR_VARIABLE_0",
      indirect: false,
    },
    {
      name: "numeric variable ID",
      variable: 0,
      address: "VAR_VARIABLE_0",
      indirect: false,
    },
    {
      name: "direct function argument",
      variable: directArg,
      address: directArg.symbol,
      indirect: false,
    },
    {
      name: "indirect function argument",
      variable: indirectArg,
      address: indirectArg.symbol,
      indirect: true,
    },
    {
      name: "wrapped scalar variable",
      variable: { type: "variable", value: "0" },
      address: "VAR_VARIABLE_0",
      indirect: false,
    },
    {
      name: "statically indexed array variable",
      variable: {
        type: "variable",
        value: arrayId,
        index: { type: "number", value: 2 },
      },
      address: "^/(VAR_ARRAY + 2)/",
      indirect: false,
    },
    {
      name: "runtime-indexed array variable",
      variable: {
        type: "variable",
        value: arrayId,
        index: { type: "variable", value: indexId },
      },
      address: ".LOCAL_TMP0_ARRAY_PTR",
      indirect: true,
      expectedSetup: [
        ".R_INT16    VAR_ARRAY",
        ".R_REF      VAR_INDEX",
        ".R_OPERATOR .ADD",
        ".R_REF_SET  .LOCAL_TMP0_ARRAY_PTR",
      ],
    },
    {
      name: "indexed array function argument",
      variable: {
        type: "variable",
        value: arrayArg,
        index: { type: "number", value: 2 },
      },
      address: ".LOCAL_TMP0_ARRAY_PTR",
      indirect: true,
      expectedSetup: [
        ".R_REF      .SCRIPT_ARG_INDIRECT_2_VARIABLE",
        ".R_INT16    2",
        ".R_OPERATOR .ADD",
        ".R_REF_SET  .LOCAL_TMP0_ARRAY_PTR",
      ],
    },
  ];

  const createVariableTestBuilder = () =>
    createTestScriptBuilder(
      {},
      {
        variablesLookup: {
          [arrayId]: {
            id: arrayId,
            name: "Array",
            symbol: "var_array",
            type: "array",
            length: 4,
          },
          [indexId]: {
            id: indexId,
            name: "Index",
            symbol: "var_index",
            type: "number",
          },
        },
        engineFields: {
          testField: {
            ...dummyEngineFieldSchema,
            key: "testField",
            cType: "BYTE",
          },
          testField16: {
            ...dummyEngineFieldSchema,
            key: "testField16",
            cType: "WORD",
          },
        },
        tilesets: [
          {
            ...dummyTilesetResource,
            data: new Uint8Array(),
          },
        ],
      },
    );

  const resolvedAddressForOutput = (output: string[], address: string) => {
    if (!address.includes("ARRAY_PTR")) {
      return address;
    }
    const pointer = output
      .join("\n")
      .match(/\.R_REF_SET\s+(\.LOCAL_TMP\d+_ARRAY_PTR)/)?.[1];
    expect(pointer).toBeDefined();
    return pointer as string;
  };

  const expectVariableSetup = (
    script: string,
    expectedSetup: string[],
    address: string,
    resolvedAddress: string,
  ) => {
    for (const fragment of expectedSetup) {
      expect(script).toContain(fragment.replace(address, resolvedAddress));
    }
  };

  test.each(cases)(
    "writes to a $name",
    async ({ variable, address, indirect, expectedSetup = [] }) => {
      const { sb, output } = await createVariableTestBuilder();

      sb.variableSetToValue(variable, 7);

      const script = output.join("\n");
      const resolvedAddress = resolvedAddressForOutput(output, address);
      expectVariableSetup(script, expectedSetup, address, resolvedAddress);
      if (indirect) {
        expect(script).toContain(`VM_SET_INDIRECT         ${resolvedAddress},`);
      } else {
        expect(script).toContain(
          `VM_SET_CONST            ${resolvedAddress}, 7`,
        );
        expect(script).not.toContain("VM_SET_INDIRECT");
      }
    },
  );

  test.each(cases)(
    "reads and writes a $name",
    async ({ variable, address, indirect, expectedSetup = [] }) => {
      const { sb, output } = await createVariableTestBuilder();

      sb.variablesOperation(variable, ".ADD", "1", false);

      const script = output.join("\n");
      const resolvedAddress = resolvedAddressForOutput(output, address);
      expectVariableSetup(script, expectedSetup, address, resolvedAddress);
      if (indirect) {
        expect(script).toContain(`.R_REF_IND  ${resolvedAddress}`);
        expect(script).toContain(`.R_REF_SET_IND ${resolvedAddress}`);
      } else {
        expect(script).toContain(`.R_REF      ${resolvedAddress}`);
        expect(script).toContain(`.R_REF_SET  ${resolvedAddress}`);
        expect(script).not.toContain(".R_REF_IND");
        expect(script).not.toContain(".R_REF_SET_IND");
      }
    },
  );

  test.each(cases)(
    "stores an actor direction in a $name",
    async ({ variable, address, indirect, expectedSetup = [] }) => {
      const { sb, output } = await createVariableTestBuilder();

      sb.actorGetDirection(variable);

      const script = output.join("\n");
      const resolvedAddress = resolvedAddressForOutput(output, address);
      expectVariableSetup(script, expectedSetup, address, resolvedAddress);
      if (indirect) {
        expect(
          output.some(
            (line) =>
              line.includes("VM_ACTOR_GET_DIR") &&
              line.includes("DIR_DEST_VAR"),
          ),
        ).toBe(true);
        expect(script).toContain(`VM_SET_INDIRECT         ${resolvedAddress},`);
      } else {
        expect(script).toContain(
          `VM_ACTOR_GET_DIR        .LOCAL_ACTOR, ${resolvedAddress}`,
        );
        expect(script).not.toContain("VM_SET_INDIRECT");
      }
    },
  );

  const runtimeIndexedVariable = (): ScriptBuilderVariable => ({
    type: "variable",
    value: arrayId,
    index: { type: "variable", value: indexId },
  });

  const indirectRead = /\.R_REF_IND\s+\.LOCAL_TMP\d+_ARRAY_PTR/;
  const indirectRpnWrite = /\.R_REF_SET_IND\s+\.LOCAL_TMP\d+_ARRAY_PTR/;
  const indirectWrite = /VM_SET_INDIRECT\s+\.LOCAL_TMP\d+_ARRAY_PTR,/;
  const indirectPush = /VM_PUSH_VALUE_IND\s+\.LOCAL_TMP\d+_ARRAY_PTR/;

  const activeMethodCases: {
    name: string;
    invoke: (sb: ScriptBuilder, variable: ScriptBuilderVariable) => void;
    expected: RegExp;
  }[] = [
    {
      name: "actorGetPosition",
      invoke: (sb, variable) => sb.actorGetPosition(variable, variable),
      expected: indirectRpnWrite,
    },
    {
      name: "actorGetPositionX",
      invoke: (sb, variable) => sb.actorGetPositionX(variable),
      expected: indirectRpnWrite,
    },
    {
      name: "actorGetPositionY",
      invoke: (sb, variable) => sb.actorGetPositionY(variable),
      expected: indirectRpnWrite,
    },
    {
      name: "actorGetAnimFrame",
      invoke: (sb, variable) => sb.actorGetAnimFrame(variable),
      expected: indirectWrite,
    },
    {
      name: "launchProjectileInAngleVariable",
      invoke: (sb, variable) =>
        sb.launchProjectileInAngleVariable(0, 0, 0, variable),
      expected: indirectRead,
    },
    {
      name: "textChoice",
      invoke: (sb, variable) =>
        sb.textChoice(variable, { trueText: "Yes", falseText: "No" }),
      expected: indirectWrite,
    },
    {
      name: "textMenu",
      invoke: (sb, variable) => sb.textMenu(variable, ["One", "Two"]),
      expected: indirectWrite,
    },
    {
      name: "threadStart",
      invoke: (sb, variable) => sb.threadStart(variable, []),
      expected: indirectWrite,
    },
    {
      name: "threadTerminate",
      invoke: (sb, variable) => sb.threadTerminate(variable),
      expected: indirectPush,
    },
    {
      name: "variableSetToRandom",
      invoke: (sb, variable) => sb.variableSetToRandom(variable, 0, 10),
      expected: indirectWrite,
    },
    {
      name: "variableValueOperation",
      invoke: (sb, variable) =>
        sb.variableValueOperation(variable, ".ADD", 1, false),
      expected: indirectRpnWrite,
    },
    {
      name: "variablesOperation source variable",
      invoke: (sb, variable) =>
        sb.variablesOperation("0", ".ADD", variable, false),
      expected: indirectRead,
    },
    {
      name: "variablesScriptValueOperation",
      invoke: (sb, variable) =>
        sb.variablesScriptValueOperation(variable, ".ADD", {
          type: "number",
          value: 1,
        }),
      expected: indirectRpnWrite,
    },
    {
      name: "variableRandomOperation",
      invoke: (sb, variable) =>
        sb.variableRandomOperation(variable, ".ADD", 0, 10, false),
      expected: indirectRpnWrite,
    },
    {
      name: "variableAddFlags",
      invoke: (sb, variable) => sb.variableAddFlags(variable, 1),
      expected: indirectRpnWrite,
    },
    {
      name: "variableClearFlags",
      invoke: (sb, variable) => sb.variableClearFlags(variable, 1),
      expected: indirectRpnWrite,
    },
    {
      name: "variableEvaluateExpression",
      invoke: (sb, variable) => sb.variableEvaluateExpression(variable, "1"),
      expected: indirectRpnWrite,
    },
    {
      name: "variableDataTableLookup",
      invoke: (sb, variable) =>
        sb.variableDataTableLookup(variable, {
          label: "Test Data",
          variables: [{ type: "variable", value: "0" }],
          rows: [{ values: [{ type: "number", value: 1 }] }],
        }),
      expected: indirectRead,
    },
    {
      name: "engineFieldStoreInVariable",
      invoke: (sb, variable) =>
        sb.engineFieldStoreInVariable("testField", variable),
      expected: indirectWrite,
    },
    {
      name: "engineFieldStoreInVariable with a 16-bit field",
      invoke: (sb, variable) =>
        sb.engineFieldStoreInVariable("testField16", variable),
      expected: indirectWrite,
    },
    {
      name: "ifVariableCompare",
      invoke: (sb, variable) => sb.ifVariableCompare(variable, ".EQ", "0"),
      expected: indirectPush,
    },
    {
      name: "ifVariableCompareScriptValue",
      invoke: (sb, variable) =>
        sb.ifVariableCompareScriptValue(variable, ".EQ", {
          type: "number",
          value: 1,
        }),
      expected: indirectPush,
    },
    {
      name: "ifVariableCompare second variable",
      invoke: (sb, variable) => sb.ifVariableCompare("0", ".EQ", variable),
      expected: indirectPush,
    },
    {
      name: "ifVariableBitwiseValue",
      invoke: (sb, variable) =>
        sb.ifVariableBitwiseValue(variable, ".B_AND", 1),
      expected: indirectRead,
    },
    {
      name: "caseVariableConstValue",
      invoke: (sb, variable) =>
        sb.caseVariableConstValue(variable, [
          { value: { type: "number", value: 1 }, branch: [] },
        ]),
      expected: indirectPush,
    },
  ];

  test.each(activeMethodCases)(
    "$name supports runtime-indexed variables",
    async ({ invoke, expected }) => {
      const { sb, output } = await createVariableTestBuilder();

      invoke(sb, runtimeIndexedVariable());

      const script = output.join("\n");
      expect(script).toContain(".R_INT16    VAR_ARRAY");
      expect(script).toContain(".R_REF      VAR_INDEX");
      expect(script).toMatch(/\.R_REF_SET\s+\.LOCAL_TMP\d+_ARRAY_PTR/);
      expect(script).toMatch(expected);
    },
  );

  const deprecatedMethodCases: {
    name: string;
    invoke: (api: DeprecatedAPI, variable: ScriptBuilderVariable) => void;
    expected: RegExp;
  }[] = [
    {
      name: "variableSetToProperty",
      invoke: (api, variable) =>
        api.variableSetToProperty(variable, "player:xpos"),
      expected: indirectRpnWrite,
    },
    {
      name: "variableSetToUnionValue",
      invoke: (api, variable) =>
        api.variableSetToUnionValue(variable, { type: "number", value: 1 }),
      expected: indirectWrite,
    },
    {
      name: "actorMoveToVariables",
      invoke: (api, variable) =>
        api.actorMoveToVariables(variable, variable, true),
      expected: indirectRead,
    },
    {
      name: "actorSetPositionToVariables",
      invoke: (api, variable) =>
        api.actorSetPositionToVariables(variable, variable),
      expected: indirectRead,
    },
    {
      name: "actorSetDirectionToVariable",
      invoke: (api, variable) => api.actorSetDirectionToVariable(variable),
      expected: indirectPush,
    },
    {
      name: "actorSetFrameToVariable",
      invoke: (api, variable) => api.actorSetFrameToVariable(variable),
      expected: indirectPush,
    },
    {
      name: "cameraMoveToVariables",
      invoke: (api, variable) => api.cameraMoveToVariables(variable, variable),
      expected: indirectRead,
    },
    {
      name: "cameraShakeVariables",
      invoke: (api, variable) =>
        api.cameraShakeVariables(true, true, 10, variable),
      expected: indirectRead,
    },
    {
      name: "variableSetToTrue",
      invoke: (api, variable) => api.variableSetToTrue(variable),
      expected: indirectWrite,
    },
    {
      name: "variableSetToFalse",
      invoke: (api, variable) => api.variableSetToFalse(variable),
      expected: indirectWrite,
    },
    {
      name: "variablesAdd",
      invoke: (api, variable) => api.variablesAdd(variable, variable, false),
      expected: indirectRpnWrite,
    },
    {
      name: "variablesSub",
      invoke: (api, variable) => api.variablesSub(variable, variable, false),
      expected: indirectRpnWrite,
    },
    {
      name: "variablesMul",
      invoke: (api, variable) => api.variablesMul(variable, variable),
      expected: indirectRpnWrite,
    },
    {
      name: "variablesDiv",
      invoke: (api, variable) => api.variablesDiv(variable, variable),
      expected: indirectRpnWrite,
    },
    {
      name: "variablesMod",
      invoke: (api, variable) => api.variablesMod(variable, variable),
      expected: indirectRpnWrite,
    },
    {
      name: "variableFromUnion",
      invoke: (api, variable) =>
        api.variableFromUnion({ type: "number", value: 1 }, variable),
      expected: indirectWrite,
    },
    {
      name: "engineFieldSetToVariable",
      invoke: (api, variable) =>
        api.engineFieldSetToVariable("testField", variable),
      expected: indirectPush,
    },
    {
      name: "replaceTileXYVariable",
      invoke: (api, variable) =>
        api.replaceTileXYVariable(0, 0, "tileset1", variable, "8px"),
      expected: indirectPush,
    },
    {
      name: "ifVariableTrue",
      invoke: (api, variable) => api.ifVariableTrue(variable),
      expected: indirectPush,
    },
    {
      name: "ifVariableValue",
      invoke: (api, variable) => api.ifVariableValue(variable, ".EQ", 1),
      expected: indirectPush,
    },
    {
      name: "ifActorDistanceVariableFromActor",
      invoke: (api, variable) =>
        api.ifActorDistanceVariableFromActor(variable, ".LT", "player"),
      expected: indirectRead,
    },
    {
      name: "caseVariableValue",
      invoke: (api, variable) => api.caseVariableValue(variable, { 1: [] }),
      expected: indirectPush,
    },
  ];

  test.each(deprecatedMethodCases)(
    "deprecated $name supports runtime-indexed variables",
    async ({ invoke, expected }) => {
      const { sb, output } = await createVariableTestBuilder();

      invoke(sb as unknown as DeprecatedAPI, runtimeIndexedVariable());

      const script = output.join("\n");
      expect(script).toContain(".R_INT16    VAR_ARRAY");
      expect(script).toContain(".R_REF      VAR_INDEX");
      expect(script).toMatch(/\.R_REF_SET\s+\.LOCAL_TMP\d+_ARRAY_PTR/);
      expect(script).toMatch(expected);
    },
  );
});

test("Should increment an array variable with a static index", async () => {
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        "11111111-1111-1111-1111-111111111111": {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 4,
        },
      },
    },
  );

  sb.variableInc({
    type: "variable",
    value: "11111111-1111-1111-1111-111111111111",
    index: { type: "number", value: 2 },
  });

  expect(output).toEqual([
    "        ; Variable Increment By 1",
    "        VM_RPN",
    "            .R_REF      ^/(VAR_ARRAY + 2)/",
    "            .R_INT8     1",
    "            .R_OPERATOR .ADD",
    "            .R_REF_SET  ^/(VAR_ARRAY + 2)/",
    "            .R_STOP",
    "",
  ]);
});

test("Should reject data peek from a dynamically indexed array element", async () => {
  const arrayId = "11111111-1111-1111-1111-111111111111";
  const sourceIndexId = "22222222-2222-2222-2222-222222222222";
  const destinationIndexId = "33333333-3333-3333-3333-333333333333";
  const { sb } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        [arrayId]: {
          id: arrayId,
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 4,
        },
        [sourceIndexId]: {
          id: sourceIndexId,
          name: "Source Index",
          symbol: "var_source_index",
          type: "number",
        },
        [destinationIndexId]: {
          id: destinationIndexId,
          name: "Destination Index",
          symbol: "var_destination_index",
          type: "number",
        },
      },
    },
  );

  expect(() =>
    sb.dataPeek(
      0,
      {
        type: "variable",
        value: arrayId,
        index: { type: "variable", value: sourceIndexId },
      },
      {
        type: "variable",
        value: arrayId,
        index: { type: "variable", value: destinationIndexId },
      },
    ),
  ).toThrow("Variable must resolve to a direct address");
});

test("Should data peek into a dynamically indexed array element", async () => {
  const arrayId = "11111111-1111-1111-1111-111111111111";
  const destinationIndexId = "33333333-3333-3333-3333-333333333333";
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        [arrayId]: {
          id: arrayId,
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 4,
        },
        [destinationIndexId]: {
          id: destinationIndexId,
          name: "Destination Index",
          symbol: "var_destination_index",
          type: "number",
        },
      },
    },
  );

  sb.dataPeek(
    0,
    {
      type: "variable",
      value: arrayId,
      index: { type: "number", value: 3 },
    },
    {
      type: "variable",
      value: arrayId,
      index: { type: "variable", value: destinationIndexId },
    },
  );

  expect(
    output.some(
      (line) =>
        line.includes("VM_SAVE_PEEK") &&
        line.includes("PEEK_DEST") &&
        line.includes("^/(VAR_ARRAY + 3)/"),
    ),
  ).toBe(true);
  expect(
    output.some(
      (line) =>
        line.includes("VM_SET_INDIRECT") &&
        line.includes("ARRAY_PTR") &&
        line.includes("PEEK_DEST"),
    ),
  ).toBe(true);
});

test("Should link transfer single-word indirect variables", async () => {
  const { sb, output } = await createTestScriptBuilder();
  const sendVariable = {
    type: "argument" as const,
    indirect: true,
    symbol: ".SCRIPT_ARG_INDIRECT_0_VARIABLE",
  };
  const receiveVariable = {
    type: "argument" as const,
    indirect: true,
    symbol: ".SCRIPT_ARG_INDIRECT_1_VARIABLE",
  };

  sb.linkTransfer(sendVariable, receiveVariable, 1);

  expect(
    output.some(
      (line) =>
        line.includes("VM_SIO_EXCHANGE") && line.includes(".ARG0, .ARG1, 1"),
    ),
  ).toBe(true);
  expect(
    output.some(
      (line) =>
        line.includes("VM_SET_INDIRECT") &&
        line.includes(receiveVariable.symbol),
    ),
  ).toBe(true);
});

test("Should reject multiword link transfer with non-array variables", async () => {
  const { sb } = await createTestScriptBuilder();
  const sendVariable = {
    type: "argument" as const,
    indirect: true,
    symbol: ".SCRIPT_ARG_INDIRECT_0_VARIABLE",
  };
  const receiveVariable = {
    type: "argument" as const,
    indirect: true,
    symbol: ".SCRIPT_ARG_INDIRECT_1_VARIABLE",
  };

  expect(() => sb.linkTransfer(sendVariable, receiveVariable, 2)).toThrow(
    "Variable must be an array",
  );
});

test("Should link transfer between arrays of sufficient length", async () => {
  const sendVariableId = "11111111-1111-1111-1111-111111111111";
  const receiveVariableId = "22222222-2222-2222-2222-222222222222";
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        [sendVariableId]: {
          id: sendVariableId,
          name: "Send Array",
          symbol: "var_send_array",
          type: "array",
          length: 3,
        },
        [receiveVariableId]: {
          id: receiveVariableId,
          name: "Receive Array",
          symbol: "var_receive_array",
          type: "array",
          length: 2,
        },
      },
    },
  );

  sb.linkTransfer(
    { type: "variable", value: sendVariableId },
    { type: "variable", value: receiveVariableId },
    2,
  );

  expect(output).toContain(
    "        VM_SIO_EXCHANGE         VAR_SEND_ARRAY, VAR_RECEIVE_ARRAY, 2",
  );
});

test("Should reject link transfers larger than a global array", async () => {
  const sendVariableId = "11111111-1111-1111-1111-111111111111";
  const receiveVariableId = "22222222-2222-2222-2222-222222222222";
  const { sb } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        [sendVariableId]: {
          id: sendVariableId,
          name: "Send Array",
          symbol: "var_send_array",
          type: "array",
          length: 2,
        },
        [receiveVariableId]: {
          id: receiveVariableId,
          name: "Receive Array",
          symbol: "var_receive_array",
          type: "array",
          length: 3,
        },
      },
    },
  );

  expect(() =>
    sb.linkTransfer(
      { type: "variable", value: sendVariableId },
      { type: "variable", value: receiveVariableId },
      3,
    ),
  ).toThrow("Array with length 2 is too short for required length 3");
});

test("Should link transfer multiword custom event array parameters", async () => {
  const { sb, output } = await createTestScriptBuilder();
  const sendVariable = {
    type: "argument" as const,
    indirect: true,
    array: true,
    length: 2,
    symbol: ".SCRIPT_ARG_INDIRECT_0_VARIABLE",
  };
  const receiveVariable = {
    type: "argument" as const,
    indirect: true,
    array: true,
    length: 2,
    symbol: ".SCRIPT_ARG_INDIRECT_1_VARIABLE",
  };

  sb.linkTransfer(sendVariable, receiveVariable, 2);

  expect(
    output.some(
      (line) =>
        line.includes("VM_SIO_EXCHANGE") &&
        line.includes("SIO_SEND") &&
        line.includes("SIO_RECEIVE") &&
        line.includes("2"),
    ),
  ).toBe(true);
  expect(
    output.filter((line) => line.includes("VM_PUSH_VALUE_IND")),
  ).toHaveLength(2);
  expect(
    output.filter((line) => line.includes("VM_SET_INDIRECT")),
  ).toHaveLength(2);
});

test("Should reject indexed arrays for multiword link transfers", async () => {
  const arrayId = "11111111-1111-1111-1111-111111111111";
  const { sb } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        [arrayId]: {
          id: arrayId,
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 4,
        },
      },
    },
  );

  expect(() =>
    sb.linkTransfer(
      {
        type: "variable",
        value: arrayId,
        index: { type: "number", value: 1 },
      },
      { type: "variable", value: arrayId },
      2,
    ),
  ).toThrow("Variable must reference the root of an array");
});

test("Should resolve a scalar variable object without an index", async () => {
  const { sb } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        "11111111-1111-1111-1111-111111111111": {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Number",
          symbol: "var_number",
          type: "number",
        },
      },
    },
  );

  expect(
    sb.getVariableAlias({
      type: "variable",
      value: "11111111-1111-1111-1111-111111111111",
    }),
  ).toBe("VAR_NUMBER");
});

test("Should pass an array root to an array-reference script argument", async () => {
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        "11111111-1111-1111-1111-111111111111": {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 4,
        },
      },
      customEvents: [
        {
          id: "script1",
          name: "Array Script",
          description: "",
          variables: {
            V0: {
              id: "V0",
              name: "Array",
              passByReference: "array",
              length: 3,
            },
          },
          actors: {},
          symbol: "script_1",
          script: [],
        },
      ],
    },
  );

  sb.callScript("script1", {
    "$variable[V0]$": {
      type: "variable",
      value: "11111111-1111-1111-1111-111111111111",
    },
  });

  expect(output).toContain(
    "        VM_PUSH_REFERENCE       VAR_ARRAY ; Variable V0",
  );
});

test("Should reject an too-short array passed to an array-reference script argument", async () => {
  const { sb } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        "11111111-1111-1111-1111-111111111111": {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Small Array",
          symbol: "var_small_array",
          type: "array",
          length: 2,
        },
      },
      customEvents: [
        {
          id: "script1",
          name: "Array Script",
          description: "",
          variables: {
            V0: {
              id: "V0",
              name: "Array",
              passByReference: "array",
              length: 3,
            },
          },
          actors: {},
          symbol: "script_1",
          script: [],
        },
      ],
    },
  );

  expect(() =>
    sb.callScript("script1", {
      "$variable[V0]$": {
        type: "variable",
        value: "11111111-1111-1111-1111-111111111111",
      },
    }),
  ).toThrow(
    'Array reference argument "V0" requires at least 3 elements, but the provided array has 2',
  );
});

test("Should reject an indexed element passed to an array-reference script argument", async () => {
  const { sb } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        "11111111-1111-1111-1111-111111111111": {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 4,
        },
      },
      customEvents: [
        {
          id: "script1",
          name: "Array Script",
          description: "",
          variables: {
            V0: {
              id: "V0",
              name: "Array",
              passByReference: "array",
              length: 8,
            },
          },
          actors: {},
          symbol: "script_1",
          script: [],
        },
      ],
    },
  );

  expect(() =>
    sb.callScript("script1", {
      "$variable[V0]$": {
        type: "variable",
        value: "11111111-1111-1111-1111-111111111111",
        index: { type: "number", value: 2 },
      },
    }),
  ).toThrow(
    'Array reference argument "V0" must reference the root of an array',
  );
});

test("Should reject a scalar passed to an array-reference script argument", async () => {
  const { sb } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        "11111111-1111-1111-1111-111111111111": {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Scalar",
          symbol: "var_scalar",
          type: "number",
        },
      },
      customEvents: [
        {
          id: "script1",
          name: "Array Script",
          description: "",
          variables: {
            V0: {
              id: "V0",
              name: "Array",
              passByReference: "array",
              length: 7,
            },
          },
          actors: {},
          symbol: "script_1",
          script: [],
        },
      ],
    },
  );

  expect(() =>
    sb.callScript("script1", {
      "$variable[V0]$": {
        type: "variable",
        value: "11111111-1111-1111-1111-111111111111",
      },
    }),
  ).toThrow('Array reference argument "V0" must be an array variable');
});

test("Should pass an array-reference argument root to another script", async () => {
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      argLookup: {
        variable: new Map([
          [
            "V1",
            {
              type: "argument",
              indirect: true,
              array: true,
              length: 2,
              symbol: ".SCRIPT_ARG_INDIRECT_0_VARIABLE",
            },
          ],
        ]),
        actor: new Map(),
      },
      customEvents: [
        {
          id: "script1",
          name: "Array Script",
          description: "",
          variables: {
            V0: {
              id: "V0",
              name: "Array",
              passByReference: "array",
              length: 2,
            },
          },
          actors: {},
          symbol: "script_1",
          script: [],
        },
      ],
    },
  );

  sb.callScript("script1", {
    "$variable[V0]$": {
      type: "variable",
      value: "V1",
    },
  });

  expect(output).toContain(
    "        VM_PUSH_VALUE           .SCRIPT_ARG_INDIRECT_0_VARIABLE",
  );
});

test("Should reject a too-short forwarded array-reference argument", async () => {
  const { sb } = await createTestScriptBuilder(
    {},
    {
      argLookup: {
        variable: new Map([
          [
            "V1",
            {
              type: "argument",
              indirect: true,
              array: true,
              length: 2,
              symbol: ".SCRIPT_ARG_INDIRECT_0_VARIABLE",
            },
          ],
        ]),
        actor: new Map(),
      },
      customEvents: [
        {
          id: "script1",
          name: "Array Script",
          description: "",
          variables: {
            V0: {
              id: "V0",
              name: "Array",
              passByReference: "array",
              length: 3,
            },
          },
          actors: {},
          symbol: "script_1",
          script: [],
        },
      ],
    },
  );

  expect(() =>
    sb.callScript("script1", {
      "$variable[V0]$": {
        type: "variable",
        value: "V1",
      },
    }),
  ).toThrow(
    'Array reference argument "V0" requires at least 3 elements, but the provided array has 2',
  );
});

test("Should loop over every element of an array", async () => {
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        "11111111-1111-1111-1111-111111111111": {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 3,
        },
        "22222222-2222-2222-2222-222222222222": {
          id: "22222222-2222-2222-2222-222222222222",
          name: "Current Value",
          symbol: "var_current_value",
          type: "number",
        },
      },
    },
  );

  sb.arrayForEach(
    "22222222-2222-2222-2222-222222222222",
    {
      type: "variable",
      value: "11111111-1111-1111-1111-111111111111",
    },
    () => sb.variableInc("22222222-2222-2222-2222-222222222222"),
  );

  expect(output).toContain("        ; Array For Each");
  expect(output).toContain("        ; Variable Increment By 1");
  expect(
    output.some(
      (line) => line.includes("VM_SET_CONST") && line.includes("ARRAY_INDEX"),
    ),
  ).toBe(true);
  expect(
    output.some(
      (line) => line.includes("VM_SET") && line.includes("VAR_CURRENT_VALUE"),
    ),
  ).toBe(true);
  expect(
    output.some(
      (line) => line.includes(".LT") && line.includes("ARRAY_INDEX, 3"),
    ),
  ).toBe(true);
  expect(output.some((line) => line.includes("VAR_ARRAY"))).toBe(true);
});

test("Should loop over every element of a custom event array parameter", async () => {
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      argLookup: {
        variable: new Map([
          [
            "V0",
            {
              type: "argument",
              indirect: true,
              array: true,
              length: 2,
              symbol: ".SCRIPT_ARG_INDIRECT_0_VARIABLE",
            },
          ],
        ]),
        actor: new Map(),
      },
    },
  );

  sb.arrayForEach("0", { type: "variable", value: "V0" }, () =>
    sb.variableInc("0"),
  );

  expect(
    output.some((line) => line.includes(".SCRIPT_ARG_INDIRECT_0_VARIABLE")),
  ).toBe(true);
  expect(
    output.some(
      (line) => line.includes(".LT") && line.includes("ARRAY_INDEX, 2"),
    ),
  ).toBe(true);
});

test("Should increment an array variable with a constant index", async () => {
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        "11111111-1111-1111-1111-111111111111": {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 4,
        },
      },
      constantsLookup: {
        "33333333-3333-3333-3333-333333333333": {
          id: "33333333-3333-3333-3333-333333333333",
          name: "Index",
          symbol: "index",
          value: 2,
        },
      },
    },
  );

  sb.variableInc({
    type: "variable",
    value: "11111111-1111-1111-1111-111111111111",
    index: {
      type: "constant",
      value: "33333333-3333-3333-3333-333333333333",
    },
  });

  expect(output).toEqual([
    "        ; Variable Increment By 1",
    "        VM_RPN",
    "            .R_REF      ^/(VAR_ARRAY + 2)/",
    "            .R_INT8     1",
    "            .R_OPERATOR .ADD",
    "            .R_REF_SET  ^/(VAR_ARRAY + 2)/",
    "            .R_STOP",
    "",
  ]);
});

test("Should increment an array variable with a variable index", async () => {
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        "11111111-1111-1111-1111-111111111111": {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 4,
        },
        "22222222-2222-2222-2222-222222222222": {
          id: "22222222-2222-2222-2222-222222222222",
          name: "Index",
          symbol: "var_index",
          type: "number",
        },
      },
    },
  );

  sb.variableInc({
    type: "variable",
    value: "11111111-1111-1111-1111-111111111111",
    index: {
      type: "variable",
      value: "22222222-2222-2222-2222-222222222222",
    },
  });

  expect(output.join("\n")).toContain(".R_INT16    VAR_ARRAY");
  expect(output.join("\n")).toContain(".R_REF      VAR_INDEX");
  expect(output.join("\n")).toContain(".R_REF_IND");
  expect(output.join("\n")).toContain(".R_REF_SET_IND");
  expect(
    output.filter((line) => line.includes(".R_INT16    VAR_ARRAY")),
  ).toHaveLength(1);
  expect(output.join("\n")).toContain(".R_REF_SET_IND .LOCAL_TMP0_ARRAY_PTR");
  expect(output.join("\n")).not.toContain(".LOCAL_TMP1_ARRAY_PTR");
});

test("Should evaluate expressions containing array offsets", async () => {
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        "11111111-1111-1111-1111-111111111111": {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 4,
        },
        "22222222-2222-2222-2222-222222222222": {
          id: "22222222-2222-2222-2222-222222222222",
          name: "Index",
          symbol: "var_index",
          type: "number",
        },
      },
    },
  );

  sb.variableEvaluateExpression(
    "0",
    "$11111111-1111-1111-1111-111111111111$[1] + $11111111-1111-1111-1111-111111111111$[$22222222-2222-2222-2222-222222222222$]",
  );

  expect(output.join("\n")).toContain(".R_REF      ^/(VAR_ARRAY + 1)/");
  expect(output.join("\n")).toContain(".R_REF      VAR_INDEX");
  expect(output.join("\n")).toContain(".R_REF_IND");
});

test("Should replace missing variables in expressions with zero", async () => {
  const { sb, output } = await createTestScriptBuilder();
  const missingVariableId = "abcdef01-2345-6789-abcd-ef0123456789";

  sb.variableEvaluateExpression("0", `$${missingVariableId}$ + 1`);

  expect(output.join("\n")).toContain(".R_INT16    0");
});

test("Should evaluate expressions containing engine constant array offsets", async () => {
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        "11111111-1111-1111-1111-111111111111": {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 4,
        },
      },
      engineConstants: {
        ARRAY_INDEX: 3,
      },
    },
  );

  sb.variableEvaluateExpression(
    "0",
    "$11111111-1111-1111-1111-111111111111$[@engine::ARRAY_INDEX@]",
  );

  expect(output.join("\n")).toContain(".R_REF      ^/(VAR_ARRAY + 3)/");
  expect(output.join("\n")).not.toContain("ARRAY_PTR");
});

test("Should compile array length in a math expression as a constant", async () => {
  const arrayId = "11111111-1111-1111-1111-111111111111";
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        [arrayId]: {
          id: arrayId,
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 4,
        },
      },
    },
  );

  sb.variableEvaluateExpression("0", `len($${arrayId}$) + 1`);

  const script = output.join("\n");
  expect(script).toContain(".R_INT16    4");
  expect(script).not.toContain(".R_REF      VAR_ARRAY");
});

test("Should reject an indexed array length in a math expression", async () => {
  const arrayId = "11111111-1111-1111-1111-111111111111";
  const { sb } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        [arrayId]: {
          id: arrayId,
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 4,
        },
      },
    },
  );

  expect(() =>
    sb.variableEvaluateExpression("0", `len($${arrayId}$[0])`),
  ).toThrow("len() requires an array variable");
});

test("Should compile structured array length as a constant", async () => {
  const arrayId = "11111111-1111-1111-1111-111111111111";
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        [arrayId]: {
          id: arrayId,
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 5,
        },
      },
    },
  );

  sb.variableSetToScriptValue("0", {
    type: "len",
    value: { type: "variable", value: arrayId },
  });

  expect(output.join("\n")).toContain(".R_INT16    5");
});

test("Should compile custom event array parameter length as a constant", async () => {
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      argLookup: {
        variable: new Map([
          [
            "V0",
            {
              type: "argument",
              indirect: true,
              array: true,
              length: 6,
              symbol: ".SCRIPT_ARG_INDIRECT_0_VARIABLE",
            },
          ],
        ]),
        actor: new Map(),
      },
    },
  );

  sb.variableSetToScriptValue("0", {
    type: "len",
    value: { type: "variable", value: "V0" },
  });

  const script = output.join("\n");
  expect(script).toContain(".R_INT16    6");
  expect(script).not.toContain(".SCRIPT_ARG_INDIRECT_0_VARIABLE");
});

test("Should reject the length of a scalar variable", async () => {
  const scalarId = "11111111-1111-1111-1111-111111111111";
  const { sb } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        [scalarId]: {
          id: scalarId,
          name: "Scalar",
          symbol: "var_scalar",
          type: "number",
        },
      },
    },
  );

  expect(() =>
    sb.variableSetToScriptValue("0", {
      type: "len",
      value: { type: "variable", value: scalarId },
    }),
  ).toThrow("Variable must be an array");
});

test("Should read an indexed array variable from a ScriptValue", async () => {
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        "11111111-1111-1111-1111-111111111111": {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 4,
        },
      },
    },
  );

  sb.variableSetToScriptValue("0", {
    type: "variable",
    value: "11111111-1111-1111-1111-111111111111",
    index: { type: "number", value: 3 },
  });

  expect(output).toContain(
    "        VM_SET                  VAR_VARIABLE_0, ^/(VAR_ARRAY + 3)/",
  );
});

test("Should read an array using an index expression", async () => {
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        "11111111-1111-1111-1111-111111111111": {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 4,
        },
        "22222222-2222-2222-2222-222222222222": {
          id: "22222222-2222-2222-2222-222222222222",
          name: "Index",
          symbol: "var_index",
          type: "number",
        },
      },
    },
  );

  sb.variableSetToScriptValue("0", {
    type: "variable",
    value: "11111111-1111-1111-1111-111111111111",
    index: {
      type: "add",
      valueA: {
        type: "variable",
        value: "22222222-2222-2222-2222-222222222222",
      },
      valueB: { type: "number", value: 1 },
    },
  });

  expect(output.join("\n")).toContain(".R_INT16    VAR_ARRAY");
  expect(output.join("\n")).toContain(".R_REF      VAR_INDEX");
  expect(output.join("\n").match(/\.R_OPERATOR \.ADD/g)).toHaveLength(2);
  expect(output.join("\n")).toContain("VM_PUSH_VALUE_IND");
});

test("Should read an array using a nested indexed variable expression", async () => {
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        "11111111-1111-1111-1111-111111111111": {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 8,
        },
        "22222222-2222-2222-2222-222222222222": {
          id: "22222222-2222-2222-2222-222222222222",
          name: "Other",
          symbol: "var_other",
          type: "array",
          length: 8,
        },
        "33333333-3333-3333-3333-333333333333": {
          id: "33333333-3333-3333-3333-333333333333",
          name: "Index",
          symbol: "var_index",
          type: "number",
        },
        "44444444-4444-4444-4444-444444444444": {
          id: "44444444-4444-4444-4444-444444444444",
          name: "Offset",
          symbol: "var_offset",
          type: "number",
        },
      },
    },
  );

  sb.variableSetToScriptValue("0", {
    type: "variable",
    value: "11111111-1111-1111-1111-111111111111",
    index: {
      type: "add",
      valueA: {
        type: "variable",
        value: "22222222-2222-2222-2222-222222222222",
        index: {
          type: "variable",
          value: "33333333-3333-3333-3333-333333333333",
        },
      },
      valueB: {
        type: "variable",
        value: "44444444-4444-4444-4444-444444444444",
      },
    },
  });

  expect(output.join("\n")).toContain(".R_INT16    VAR_OTHER");
  expect(output.join("\n")).toContain(".R_INT16    VAR_ARRAY");
  expect(output.join("\n")).toContain(".R_REF      VAR_INDEX");
  expect(output.join("\n")).toContain(".R_REF      VAR_OFFSET");
  expect(output.join("\n")).toContain(".R_REF_IND");
  expect(output.join("\n")).toContain("VM_PUSH_VALUE_IND");
});

test("Should fold a static array index expression", async () => {
  const { sb } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        "11111111-1111-1111-1111-111111111111": {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 4,
        },
      },
    },
  );

  expect(
    sb.getVariableAlias({
      type: "variable",
      value: "11111111-1111-1111-1111-111111111111",
      index: {
        type: "add",
        valueA: { type: "number", value: 1 },
        valueB: { type: "number", value: 2 },
      },
    }),
  ).toBe("^/(VAR_ARRAY + 3)/");
});

test("Should reject an out of bounds constant index expression", async () => {
  const { sb } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        "11111111-1111-1111-1111-111111111111": {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 4,
        },
      },
      constantsLookup: {
        "22222222-2222-2222-2222-222222222222": {
          id: "22222222-2222-2222-2222-222222222222",
          name: "Index",
          symbol: "index",
          value: 3,
        },
      },
    },
  );

  expect(() =>
    sb.getVariableAlias({
      type: "variable",
      value: "11111111-1111-1111-1111-111111111111",
      index: {
        type: "add",
        valueA: {
          type: "constant",
          value: "22222222-2222-2222-2222-222222222222",
        },
        valueB: { type: "number", value: 1 },
      },
    }),
  ).toThrow(
    'Array index 4 is out of bounds for variable "Array" with length 4',
  );
});

test("Should set a camera property from an indexed ScriptValue", async () => {
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        "11111111-1111-1111-1111-111111111111": {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 4,
        },
      },
    },
  );

  sb.cameraSetPropertyToScriptValue("camera_offset_x", {
    type: "variable",
    value: "11111111-1111-1111-1111-111111111111",
    index: { type: "number", value: 3 },
  });

  expect(output.join("\n")).toContain(
    "VM_SET_INT8             _camera_offset_x, ^/(VAR_ARRAY + 3)/",
  );
});

test("Should set an engine field from an indexed ScriptValue", async () => {
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        "11111111-1111-1111-1111-111111111111": {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 4,
        },
      },
      engineFields: {
        myfield: {
          ...dummyEngineFieldSchema,
          key: "myfield",
          cType: "BYTE",
        },
      },
    },
  );

  sb.engineFieldSetToScriptValue("myfield", {
    type: "variable",
    value: "11111111-1111-1111-1111-111111111111",
    index: { type: "number", value: 3 },
  });

  expect(output.join("\n")).toContain(
    "VM_SET_INT8             _myfield, ^/(VAR_ARRAY + 3)/",
  );
});

test("Should replace indexed references to number variables with variable symbol, ignoring index", async () => {
  const { sb } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        "11111111-1111-1111-1111-111111111111": {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Number",
          symbol: "var_number",
          type: "number",
        },
      },
    },
  );

  expect(
    sb.getVariableAlias({
      type: "variable",
      value: "11111111-1111-1111-1111-111111111111",
      index: { type: "number", value: 0 },
    }),
  ).toEqual("VAR_NUMBER");

  const dynamicallyIndexedVariable = {
    type: "variable" as const,
    value: "11111111-1111-1111-1111-111111111111",
    index: { type: "variable" as const, value: "L0" },
  };
  expect(sb.getVariableAlias(dynamicallyIndexedVariable)).toBe("VAR_NUMBER");
  expect(sb._isIndirectVariable(dynamicallyIndexedVariable)).toBe(false);
});

test.each([-1, 4])(
  "Should reject static array index %s outside the declared length",
  async (index) => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        variablesLookup: {
          "11111111-1111-1111-1111-111111111111": {
            id: "11111111-1111-1111-1111-111111111111",
            name: "Array",
            symbol: "var_array",
            type: "array",
            length: 4,
          },
        },
      },
    );

    expect(() =>
      sb.getVariableAlias({
        type: "variable",
        value: "11111111-1111-1111-1111-111111111111",
        index: { type: "number", value: index },
      }),
    ).toThrow(
      `Array index ${index} is out of bounds for variable "Array" with length 4`,
    );
  },
);

test("Should reject constant array indices outside the declared length", async () => {
  const { sb } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        "11111111-1111-1111-1111-111111111111": {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 4,
        },
      },
      constantsLookup: {
        "33333333-3333-3333-3333-333333333333": {
          id: "33333333-3333-3333-3333-333333333333",
          name: "Index",
          symbol: "index",
          value: 4,
        },
      },
    },
  );

  expect(() =>
    sb.getVariableAlias({
      type: "variable",
      value: "11111111-1111-1111-1111-111111111111",
      index: {
        type: "constant",
        value: "33333333-3333-3333-3333-333333333333",
      },
    }),
  ).toThrow(
    'Array index 4 is out of bounds for variable "Array" with length 4',
  );
});

test("Should read an indexed array through a by-reference script argument", async () => {
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      argLookup: {
        variable: new Map([
          [
            "V0",
            {
              type: "argument",
              indirect: true,
              array: true,
              symbol: ".SCRIPT_ARG_INDIRECT_0_VARIABLE",
            },
          ],
          [
            "V1",
            {
              type: "argument",
              indirect: true,
              array: false,
              symbol: ".SCRIPT_ARG_INDIRECT_1_VARIABLE",
            },
          ],
        ]),
        actor: new Map(),
      },
    },
  );

  sb.variableSetToScriptValue("V1", {
    type: "variable",
    value: "V0",
    index: { type: "number", value: 3 },
  });

  const script = output.join("\n");
  expect(script).toContain(".R_REF      .SCRIPT_ARG_INDIRECT_0_VARIABLE");
  expect(script).toContain(".R_INT16    3");
  expect(script).toContain(".R_REF_SET  .LOCAL_TMP0_ARRAY_PTR");
  expect(script).toContain("VM_PUSH_VALUE_IND       .LOCAL_TMP0_ARRAY_PTR");
  expect(script).toContain("VM_SET_INDIRECT");
  expect(script).toContain(".SCRIPT_ARG_INDIRECT_1_VARIABLE - 1");
  expect(script).not.toContain("^/(.SCRIPT_ARG_INDIRECT_0_VARIABLE + 3)/");
});

test("Should read a constant index through an array-reference script argument", async () => {
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      argLookup: {
        variable: new Map([
          [
            "V0",
            {
              type: "argument",
              indirect: true,
              array: true,
              symbol: ".SCRIPT_ARG_INDIRECT_0_VARIABLE",
            },
          ],
          [
            "V1",
            {
              type: "argument",
              indirect: true,
              array: false,
              symbol: ".SCRIPT_ARG_INDIRECT_1_VARIABLE",
            },
          ],
        ]),
        actor: new Map(),
      },
      constantsLookup: {
        "33333333-3333-3333-3333-333333333333": {
          id: "33333333-3333-3333-3333-333333333333",
          name: "Index",
          symbol: "index",
          value: 3,
        },
      },
    },
  );

  sb.variableSetToScriptValue("V1", {
    type: "variable",
    value: "V0",
    index: {
      type: "constant",
      value: "33333333-3333-3333-3333-333333333333",
    },
  });

  const script = output.join("\n");
  expect(script).toContain(".R_REF      .SCRIPT_ARG_INDIRECT_0_VARIABLE");
  expect(script).toContain(".R_INT16    3");
  expect(script).not.toContain("VAR_INDEX");
});

test("Should write an indexed array through a by-reference script argument", async () => {
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      argLookup: {
        variable: new Map([
          [
            "V0",
            {
              type: "argument",
              indirect: true,
              array: true,
              symbol: ".SCRIPT_ARG_INDIRECT_0_VARIABLE",
            },
          ],
        ]),
        actor: new Map(),
      },
    },
  );

  sb.variableSetToScriptValue(
    {
      type: "variable",
      value: "V0",
      index: { type: "number", value: 3 },
    },
    { type: "number", value: 99 },
  );

  const script = output.join("\n");
  expect(script).toContain(".R_REF      .SCRIPT_ARG_INDIRECT_0_VARIABLE");
  expect(script).toContain(".R_INT16    3");
  expect(script).toContain(
    "VM_SET_INDIRECT         .LOCAL_TMP0_ARRAY_PTR, .LOCAL_TMP1_VALUE_TMP",
  );
});

test("Should ignore indexes on a script argument passed by value", async () => {
  const { sb } = await createTestScriptBuilder(
    {},
    {
      argLookup: {
        variable: new Map([
          [
            "V0",
            {
              type: "argument",
              indirect: false,
              symbol: ".SCRIPT_ARG_0_VARIABLE",
            },
          ],
        ]),
        actor: new Map(),
      },
    },
  );

  const variable = {
    type: "variable" as const,
    value: "V0",
    index: { type: "variable" as const, value: "L0" },
  };
  expect(sb.getVariableAlias(variable)).toBe(".SCRIPT_ARG_0_VARIABLE");
  expect(sb._isIndirectVariable(variable)).toBe(false);
});

test("Should ignore indexes on a scalar script argument passed by reference", async () => {
  const { sb } = await createTestScriptBuilder(
    {},
    {
      argLookup: {
        variable: new Map([
          [
            "V0",
            {
              type: "argument",
              indirect: true,
              array: false,
              symbol: ".SCRIPT_ARG_INDIRECT_0_VARIABLE",
            },
          ],
        ]),
        actor: new Map(),
      },
    },
  );

  const variable = {
    type: "variable" as const,
    value: "V0",
    index: { type: "variable" as const, value: "L0" },
  };
  expect(sb.getVariableAlias(variable)).toBe(".SCRIPT_ARG_INDIRECT_0_VARIABLE");
  expect(sb._isIndirectVariable(variable)).toBe(true);
});

test("Should treat a missing array-reference index as zero", async () => {
  const { sb } = await createTestScriptBuilder(
    {},
    {
      argLookup: {
        variable: new Map([
          [
            "V0",
            {
              type: "argument",
              indirect: true,
              array: true,
              symbol: ".SCRIPT_ARG_INDIRECT_0_VARIABLE",
            },
          ],
        ]),
        actor: new Map(),
      },
    },
  );

  const variable = { type: "variable" as const, value: "V0" };
  expect(sb.getVariableAlias(variable)).toBe(".SCRIPT_ARG_INDIRECT_0_VARIABLE");
  expect(sb._isIndirectVariable(variable)).toBe(true);
});

test("Should not reuse the array pointer local while setting an indexed variable", async () => {
  const { sb } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        "11111111-1111-1111-1111-111111111111": {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 4,
        },
        "22222222-2222-2222-2222-222222222222": {
          id: "22222222-2222-2222-2222-222222222222",
          name: "Index",
          symbol: "var_index",
          type: "number",
        },
      },
    },
  );

  sb.variableSetToScriptValue(
    {
      type: "variable",
      value: "11111111-1111-1111-1111-111111111111",
      index: {
        type: "variable",
        value: "22222222-2222-2222-2222-222222222222",
      },
    },
    { type: "number", value: 3 },
  );
  sb._packLocals();

  const script = sb.toScriptString("MY_SCRIPT", false);
  expect(script).toContain(".LOCAL_TMP0_ARRAY_PTR = -1");
  expect(script).toContain(".LOCAL_TMP1_VALUE_TMP = -2");
  expect(script).toContain("VM_RESERVE              2");
  expect(script).toContain(
    "VM_SET_INDIRECT         .LOCAL_TMP0_ARRAY_PTR, .LOCAL_TMP1_VALUE_TMP",
  );
});

test("Should do truthy conditional test", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {} as unknown as ScriptBuilderOptions);
  sb.ifScriptValue(
    {
      type: "variable",
      value: "L0",
    },
    () => output.push("        ; TRUE"),
    () => output.push("        ; FALSE"),
  );

  expect(output).toEqual([
    "        ; If",
    "        ; -- If Truthy",
    "        VM_IF_CONST             .NE, VAR_VARIABLE_0, 0, 1$, 0",
    "        ; FALSE",
    "        VM_JUMP                 2$",
    "1$:",
    "        ; TRUE",
    "2$:",
    "",
  ]);
});

test("Should do falsy conditional test when condition wrapped with logical NOT", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {} as unknown as ScriptBuilderOptions);
  sb.ifScriptValue(
    {
      type: "not",
      value: {
        type: "variable",
        value: "L0",
      },
    },
    () => output.push("        ; TRUE"),
    () => output.push("        ; FALSE"),
  );

  expect(output).toEqual([
    "        ; If",
    "        ; -- If Falsy",
    "        VM_IF_CONST             .EQ, VAR_VARIABLE_0, 0, 1$, 0",
    "        ; FALSE",
    "        VM_JUMP                 2$",
    "1$:",
    "        ; TRUE",
    "2$:",
    "",
  ]);
});

test("Should do falsy conditional test when condition wrapped compared with FALSE on right side", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {} as unknown as ScriptBuilderOptions);
  sb.ifScriptValue(
    {
      type: "eq",
      valueA: {
        type: "variable",
        value: "L0",
      },
      valueB: {
        type: "false",
      },
    },
    () => output.push("        ; TRUE"),
    () => output.push("        ; FALSE"),
  );

  expect(output).toEqual([
    "        ; If",
    "        ; -- If Falsy",
    "        VM_IF_CONST             .EQ, VAR_VARIABLE_0, 0, 1$, 0",
    "        ; FALSE",
    "        VM_JUMP                 2$",
    "1$:",
    "        ; TRUE",
    "2$:",
    "",
  ]);
});

test("Should do falsy conditional test when condition wrapped compared with FALSE on left side", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {} as unknown as ScriptBuilderOptions);
  sb.ifScriptValue(
    {
      type: "eq",
      valueA: {
        type: "false",
      },
      valueB: {
        type: "variable",
        value: "L0",
      },
    },
    () => output.push("        ; TRUE"),
    () => output.push("        ; FALSE"),
  );

  expect(output).toEqual([
    "        ; If",
    "        ; -- If Falsy",
    "        VM_IF_CONST             .EQ, VAR_VARIABLE_0, 0, 1$, 0",
    "        ; FALSE",
    "        VM_JUMP                 2$",
    "1$:",
    "        ; TRUE",
    "2$:",
    "",
  ]);
});

test("Should do falsy conditional test when condition wrapped compared with 0 on right side", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {} as unknown as ScriptBuilderOptions);
  sb.ifScriptValue(
    {
      type: "eq",
      valueA: {
        type: "variable",
        value: "L0",
      },
      valueB: {
        type: "number",
        value: 0,
      },
    },
    () => output.push("        ; TRUE"),
    () => output.push("        ; FALSE"),
  );

  expect(output).toEqual([
    "        ; If",
    "        ; -- If Falsy",
    "        VM_IF_CONST             .EQ, VAR_VARIABLE_0, 0, 1$, 0",
    "        ; FALSE",
    "        VM_JUMP                 2$",
    "1$:",
    "        ; TRUE",
    "2$:",
    "",
  ]);
});

test("Should do falsy conditional test when condition wrapped compared with 0 on left side", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {} as unknown as ScriptBuilderOptions);
  sb.ifScriptValue(
    {
      type: "eq",
      valueA: {
        type: "number",
        value: 0,
      },
      valueB: {
        type: "variable",
        value: "L0",
      },
    },
    () => output.push("        ; TRUE"),
    () => output.push("        ; FALSE"),
  );

  expect(output).toEqual([
    "        ; If",
    "        ; -- If Falsy",
    "        VM_IF_CONST             .EQ, VAR_VARIABLE_0, 0, 1$, 0",
    "        ; FALSE",
    "        VM_JUMP                 2$",
    "1$:",
    "        ; TRUE",
    "2$:",
    "",
  ]);
});

test("should support printing fixed length variables with %D5$Var", async () => {
  const dummyCompiledFont = await getDummyCompiledFont();
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    fonts: [dummyCompiledFont],
  } as unknown as ScriptBuilderOptions);
  sb._loadStructuredText("Val = %D5$00$");
  expect(output).toEqual([
    "        VM_LOAD_TEXT            1",
    "        .dw VAR_VARIABLE_0",
    '        .asciz "Val = %D5"',
  ]);
});

test("should support printing variable length variables with %d$Var", async () => {
  const dummyCompiledFont = await getDummyCompiledFont();
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    fonts: [dummyCompiledFont],
  } as unknown as ScriptBuilderOptions);
  sb._loadStructuredText("Val = %d$00$");
  expect(output).toEqual([
    "        VM_LOAD_TEXT            1",
    "        .dw VAR_VARIABLE_0",
    '        .asciz "Val = %d"',
  ]);
});

test("should support printing variable length variables with just $Var", async () => {
  const dummyCompiledFont = await getDummyCompiledFont();
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    fonts: [dummyCompiledFont],
  } as unknown as ScriptBuilderOptions);
  sb._loadStructuredText("Val = $00$");
  expect(output).toEqual([
    "        VM_LOAD_TEXT            1",
    "        .dw VAR_VARIABLE_0",
    '        .asciz "Val = %d"',
  ]);
});

test("should support printing variable as char code with %c$Var", async () => {
  const dummyCompiledFont = await getDummyCompiledFont();
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    fonts: [dummyCompiledFont],
  } as unknown as ScriptBuilderOptions);
  sb._loadStructuredText("Val = %c$00$");
  expect(output).toEqual([
    "        VM_LOAD_TEXT            1",
    "        .dw VAR_VARIABLE_0",
    '        .asciz "Val = %c"',
  ]);
});

test("should support using variable as text speed with %t$Var", async () => {
  const dummyCompiledFont = await getDummyCompiledFont();
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    fonts: [dummyCompiledFont],
  } as unknown as ScriptBuilderOptions);
  sb._loadStructuredText("SetSpeed%t$00$NewSpeed");
  expect(output).toEqual([
    "        VM_LOAD_TEXT            1",
    "        .dw VAR_VARIABLE_0",
    '        .asciz "SetSpeed%tNewSpeed"',
  ]);
});

test("should support using variable to change font with %f$Var", async () => {
  const dummyCompiledFont = await getDummyCompiledFont();
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {
    fonts: [dummyCompiledFont],
  } as unknown as ScriptBuilderOptions);
  sb._loadStructuredText("SetFont%f$00$NewFont");
  expect(output).toEqual([
    "        VM_LOAD_TEXT            1",
    "        .dw VAR_VARIABLE_0",
    '        .asciz "SetFont%fNewFont"',
  ]);
});

test("should allow passing actors to custom event", async () => {
  const output: string[] = [];
  const additionalScripts: Record<
    string,
    {
      symbol: string;
      compiledScript: string;
    }
  > = {};
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    additionalScripts,
    scene: {
      id: "scene1",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents: [
      {
        id: "script1",
        name: "Script 1",
        description: "",
        variables: {},
        actors: {
          "0": {
            id: "0",
            name: "Actor1",
          },
        },
        symbol: "script_1",
        script: [
          {
            command: "EVENT_ACTOR_SET_POSITION",
            args: {
              actorId: "0",
              x: {
                type: "number",
                value: 0,
              },
              y: {
                type: "number",
                value: 0,
              },
            },
            id: "event1",
          },
        ],
      },
    ],
  } as unknown as ScriptBuilderOptions);
  sb.callScript("script1", {
    "$actor[0]$": "actorS0A0",
  });
  expect(output).toEqual([
    "        ; Call Script: Script 1",
    "        VM_PUSH_CONST           1 ; Actor 0",
    "        VM_CALL_FAR             ___bank_script_1, _script_1",
    "",
  ]);
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `VM_SET                  .LOCAL_ACTOR, .SCRIPT_ARG_0_ACTOR`,
  );
});

test("should allow passing actors to nested custom event", async () => {
  const output: string[] = [];
  const additionalScripts: Record<
    string,
    {
      symbol: string;
      compiledScript: string;
    }
  > = {};
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    additionalScripts,
    scene: {
      id: "scene1",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents: [
      {
        id: "script1",
        name: "Script 1",
        description: "",
        variables: {},
        actors: {
          "0": {
            id: "0",
            name: "Actor1",
          },
        },
        symbol: "script_1",
        script: [
          {
            command: "EVENT_ACTOR_SET_POSITION",
            args: {
              actorId: "0",
              x: {
                type: "number",
                value: 0,
              },
              y: {
                type: "number",
                value: 0,
              },
            },
            id: "event1",
          },
        ],
      },
      {
        id: "script2",
        name: "Script 2",
        description: "",
        variables: {},
        actors: {
          "0": {
            id: "0",
            name: "Actor1",
          },
        },
        symbol: "script_2",
        script: [
          {
            command: "EVENT_CALL_CUSTOM_EVENT",
            args: {
              customEventId: "script1",
              "$actor[0]$": "0",
            },
            id: "event2",
          },
        ],
      },
    ],
  } as unknown as ScriptBuilderOptions);
  sb.callScript("script2", {
    "$actor[0]$": "actorS0A0",
  });
  expect(output).toEqual([
    "        ; Call Script: Script 2",
    "        VM_PUSH_CONST           1 ; Actor 0",
    "        VM_CALL_FAR             ___bank_script_2, _script_2",
    "",
  ]);
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `VM_SET                  .LOCAL_ACTOR, .SCRIPT_ARG_0_ACTOR`,
  );
  expect(additionalScripts["script_2"]?.compiledScript).toContain(
    `VM_PUSH_VALUE           .SCRIPT_ARG_0_ACTOR`,
  );
});

test("Should expand expressions for if conditional test", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {} as unknown as ScriptBuilderOptions);
  sb.ifScriptValue(
    {
      type: "add",
      valueA: {
        type: "variable",
        value: "L0",
      },
      valueB: {
        type: "number",
        value: 42,
      },
    },
    () => output.push("        ; TRUE"),
    () => output.push("        ; FALSE"),
  );

  expect(output).toEqual([
    "        ; If",
    "        ; -- Calculate value",
    "        VM_RPN",
    "            .R_REF      VAR_VARIABLE_0",
    "            .R_INT16    42",
    "            .R_OPERATOR .ADD",
    "            .R_STOP",
    "        ; -- If Truthy",
    "        VM_IF_CONST             .NE, .ARG0, 0, 1$, 1",
    "        ; FALSE",
    "        VM_JUMP                 2$",
    "1$:",
    "        ; TRUE",
    "2$:",
    "",
  ]);
});

test("Should expand expressions for if conditional falsy test", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {} as unknown as ScriptBuilderOptions);
  sb.ifScriptValue(
    {
      type: "not",
      value: {
        type: "add",
        valueA: {
          type: "variable",
          value: "L0",
        },
        valueB: {
          type: "number",
          value: 42,
        },
      },
    },
    () => output.push("        ; TRUE"),
    () => output.push("        ; FALSE"),
  );

  expect(output).toEqual([
    "        ; If",
    "        ; -- Calculate value",
    "        VM_RPN",
    "            .R_REF      VAR_VARIABLE_0",
    "            .R_INT16    42",
    "            .R_OPERATOR .ADD",
    "            .R_STOP",
    "        ; -- If Falsy",
    "        VM_IF_CONST             .EQ, .ARG0, 0, 1$, 1",
    "        ; FALSE",
    "        VM_JUMP                 2$",
    "1$:",
    "        ; TRUE",
    "2$:",
    "",
  ]);
});

test("Should optimise expressions when expanding for if conditional test", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {} as unknown as ScriptBuilderOptions);
  sb.ifScriptValue(
    {
      type: "add",
      valueA: {
        type: "variable",
        value: "L0",
      },
      valueB: {
        type: "add",
        valueA: {
          type: "number",
          value: 10,
        },
        valueB: {
          type: "number",
          value: 42,
        },
      },
    },
    () => output.push("        ; TRUE"),
    () => output.push("        ; FALSE"),
  );

  expect(output).toEqual([
    "        ; If",
    "        ; -- Calculate value",
    "        VM_RPN",
    "            .R_REF      VAR_VARIABLE_0",
    "            .R_INT16    52",
    "            .R_OPERATOR .ADD",
    "            .R_STOP",
    "        ; -- If Truthy",
    "        VM_IF_CONST             .NE, .ARG0, 0, 1$, 1",
    "        ; FALSE",
    "        VM_JUMP                 2$",
    "1$:",
    "        ; TRUE",
    "2$:",
    "",
  ]);
});

test("Should allow rnd to be used in rpn without script neutral error", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {} as unknown as ScriptBuilderOptions);
  sb._rpn().int8(8).operator(".RND").stop();
  sb._stackPop(1);
  expect(sb._stop).not.toThrow();
  expect(output).toEqual([
    "        VM_RPN",
    "            .R_INT8     8",
    "            .R_OPERATOR .RND",
    "            .R_STOP",
    "        VM_POP                  1",
    "        ; Stop Script",
    "        VM_STOP",
  ]);
});

test("Should allow camera ref memory to be used in rpn without script neutral error if value NOT stored", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {} as unknown as ScriptBuilderOptions);
  sb._rpn().refMem(".MEM_I8", "memory_address").stop();
  sb._stackPop(1);
  expect(sb._stop).not.toThrow();
  expect(output).toEqual([
    "        VM_RPN",
    "            .R_REF_MEM  .MEM_I8, _memory_address",
    "            .R_STOP",
    "        VM_POP                  1",
    "        ; Stop Script",
    "        VM_STOP",
  ]);
});

test("Should allow camera ref memory to be used in rpn without script neutral error if value stored", () => {
  const output: string[] = [];
  const sb = new ScriptBuilder(output, {} as unknown as ScriptBuilderOptions);
  sb._rpn().refMem(".MEM_I8", "memory_address").refSet("VAR_0").stop();
  expect(sb._stop).not.toThrow();
  expect(output).toEqual([
    "        VM_RPN",
    "            .R_REF_MEM  .MEM_I8, _memory_address",
    "            .R_REF_SET  VAR_0",
    "            .R_STOP",
    "        ; Stop Script",
    "        VM_STOP",
  ]);
});

test("should reuse symbol for input scripts with identical contents", async () => {
  const output: string[] = [];
  const additionalScripts: Record<
    string,
    {
      symbol: string;
      compiledScript: string;
    }
  > = {};
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    additionalScripts,
    scene: {
      id: "scene1",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents: [
      {
        id: "script1",
        name: "Script 1",
        description: "",
        variables: {},
        actors: {
          "0": {
            id: "0",
            name: "Actor1",
          },
        },
        symbol: "script_1",
        script: [
          {
            command: "EVENT_SET_INPUT_SCRIPT",
            args: {
              input: ["b"],
              override: true,
            },
            children: {
              true: [
                {
                  command: "EVENT_ACTOR_SET_POSITION",
                  args: {
                    actorId: "$self$",
                    x: {
                      type: "number",
                      value: 1,
                    },
                    y: {
                      type: "number",
                      value: 2,
                    },
                  },
                  id: "d319a055-a2d9-42f9-9c93-0a348dfcae6d",
                },
              ],
            },
            id: "cc795643-f9eb-45fc-b601-c724403c08bf",
          },
          {
            command: "EVENT_SET_INPUT_SCRIPT",
            args: {
              input: ["a"],
              override: true,
            },
            children: {
              true: [
                {
                  command: "EVENT_ACTOR_SET_POSITION",
                  args: {
                    actorId: "$self$",
                    x: {
                      type: "number",
                      value: 1,
                    },
                    y: {
                      type: "number",
                      value: 2,
                    },
                  },
                  id: "0ffd4b98-cfc5-4d76-9827-3c39062ab606",
                },
              ],
            },
            id: "829ff9e2-12aa-458b-a118-f332060685ba",
          },
        ],
      },
    ],
  } as unknown as ScriptBuilderOptions);
  sb.callScript("script1", {
    "$actor[0]$": "actorS0A0",
  });

  const additionalScriptFiles = Object.keys(additionalScripts);
  expect(additionalScriptFiles.length).toEqual(2);
  expect(output).toEqual([
    "        ; Call Script: Script 1",
    "        VM_PUSH_CONST           1 ; Actor 0",
    "        VM_CALL_FAR             ___bank_script_1, _script_1",
    "",
  ]);
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `___bank_script_input, _script_input`,
  );
  expect(additionalScripts["script_1"]?.compiledScript).not.toContain(
    `___bank_script_input_0, _script_input_0`,
  );
  expect(additionalScripts["script_1"]?.compiledScript).not.toContain(
    `___bank_script_input_1, _script_input_1`,
  );
});

test("should reuse symbol for input scripts with identical contents across multiple scenes", async () => {
  const output: string[] = [];
  const output2: string[] = [];
  const symbols: Record<string, string> = {};
  const additionalScripts: Record<
    string,
    {
      symbol: string;
      compiledScript: string;
    }
  > = {};
  const additionalScriptsCache: Record<string, string> = {};

  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    additionalScripts,
    additionalScriptsCache,
    symbols,
    scene: {
      id: "scene1",
      hash: "scene1",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents: [
      {
        id: "script1",
        name: "Script 1",
        description: "",
        variables: {},
        actors: {
          "0": {
            id: "0",
            name: "Actor1",
          },
        },
        symbol: "script_1",
        script: [
          {
            command: "EVENT_SET_INPUT_SCRIPT",
            args: {
              input: ["b"],
              override: true,
            },
            children: {
              true: [
                {
                  command: "EVENT_ACTOR_SET_POSITION",
                  args: {
                    actorId: "$self$",
                    x: {
                      type: "number",
                      value: 1,
                    },
                    y: {
                      type: "number",
                      value: 2,
                    },
                  },
                  id: "event1",
                },
              ],
            },
            id: "event2",
          },
        ],
      },
    ],
  } as unknown as ScriptBuilderOptions);

  const sb2 = new ScriptBuilder(output2, {
    scriptEventHandlers,
    additionalScripts,
    additionalScriptsCache,
    symbols,
    scene: {
      id: "scene2",
      hash: "scene2",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents: [
      {
        id: "script2",
        name: "Script 2",
        description: "",
        variables: {},
        actors: {
          "0": {
            id: "0",
            name: "Actor1",
          },
        },
        symbol: "script_2",
        script: [
          {
            command: "EVENT_TEXT",
            args: {
              text: ["Hello World"],
            },
          },
          {
            command: "EVENT_SET_INPUT_SCRIPT",
            args: {
              input: ["b"],
              override: true,
            },
            children: {
              true: [
                {
                  command: "EVENT_ACTOR_SET_POSITION",
                  args: {
                    actorId: "$self$",
                    x: {
                      type: "number",
                      value: 1,
                    },
                    y: {
                      type: "number",
                      value: 2,
                    },
                  },
                  id: "event3",
                },
              ],
            },
            id: "event4",
          },
        ],
      },
    ],
  } as unknown as ScriptBuilderOptions);

  sb.callScript("script1", {
    "$actor[0]$": "actorS0A0",
  });

  sb2.callScript("script2", {
    "$actor[0]$": "actorS0A0",
  });

  const additionalScriptFiles = Object.keys(additionalScripts);
  expect(additionalScriptFiles.length).toEqual(3);
  expect(output).toEqual([
    "        ; Call Script: Script 1",
    "        VM_PUSH_CONST           1 ; Actor 0",
    "        VM_CALL_FAR             ___bank_script_1, _script_1",
    "",
  ]);
  expect(output2).toEqual([
    "        ; Call Script: Script 2",
    "        VM_PUSH_CONST           1 ; Actor 0",
    "        VM_CALL_FAR             ___bank_script_2, _script_2",
    "",
  ]);
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `___bank_script_input, _script_input`,
  );
  expect(additionalScripts["script_1"]?.compiledScript).not.toContain(
    `___bank_script_input_0, _script_input_0`,
  );
  expect(additionalScripts["script_1"]?.compiledScript).not.toContain(
    `___bank_script_input_1, _script_input_1`,
  );
  expect(additionalScripts["script_2"]?.compiledScript).toContain(
    `___bank_script_input, _script_input`,
  );
  expect(additionalScripts["script_2"]?.compiledScript).not.toContain(
    `___bank_script_input_0, _script_input_0`,
  );
  expect(additionalScripts["script_2"]?.compiledScript).not.toContain(
    `___bank_script_input_1, _script_input_1`,
  );
});

test("should reuse input symbol but NOT script symbol when scripts are identical across scenes", async () => {
  const output: string[] = [];
  const output2: string[] = [];
  const symbols: Record<string, string> = {};
  const additionalScripts: Record<
    string,
    {
      symbol: string;
      compiledScript: string;
    }
  > = {};
  const additionalScriptsCache: Record<string, string> = {};

  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    additionalScripts,
    additionalScriptsCache,
    symbols,
    scene: {
      id: "scene1",
      hash: "scene1",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents: [
      {
        id: "script1",
        name: "Script 1",
        description: "",
        variables: {},
        actors: {
          "0": {
            id: "0",
            name: "Actor1",
          },
        },
        symbol: "script_1",
        script: [
          {
            command: "EVENT_SET_INPUT_SCRIPT",
            args: {
              input: ["b"],
              override: true,
            },
            children: {
              true: [
                {
                  command: "EVENT_ACTOR_SET_POSITION",
                  args: {
                    actorId: "$self$",
                    x: {
                      type: "number",
                      value: 1,
                    },
                    y: {
                      type: "number",
                      value: 2,
                    },
                  },
                  id: "event1",
                },
              ],
            },
            id: "event2",
          },
        ],
      },
    ],
  } as unknown as ScriptBuilderOptions);

  const sb2 = new ScriptBuilder(output2, {
    scriptEventHandlers,
    additionalScripts,
    additionalScriptsCache,
    symbols,
    scene: {
      id: "scene2",
      hash: "scene2",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents: [
      {
        id: "script2",
        name: "Script 2",
        description: "",
        variables: {},
        actors: {
          "0": {
            id: "0",
            name: "Actor1",
          },
        },
        symbol: "script_2",
        script: [
          {
            command: "EVENT_SET_INPUT_SCRIPT",
            args: {
              input: ["b"],
              override: true,
            },
            children: {
              true: [
                {
                  command: "EVENT_ACTOR_SET_POSITION",
                  args: {
                    actorId: "$self$",
                    x: {
                      type: "number",
                      value: 1,
                    },
                    y: {
                      type: "number",
                      value: 2,
                    },
                  },
                  id: "event3",
                },
              ],
            },
            id: "event4",
          },
        ],
      },
    ],
  } as unknown as ScriptBuilderOptions);

  sb.callScript("script1", {
    "$actor[0]$": "actorS0A0",
  });

  sb2.callScript("script2", {
    "$actor[0]$": "actorS0A0",
  });

  const additionalScriptFiles = Object.keys(additionalScripts);
  expect(additionalScriptFiles.length).toEqual(3);
  expect(output).toEqual([
    "        ; Call Script: Script 1",
    "        VM_PUSH_CONST           1 ; Actor 0",
    "        VM_CALL_FAR             ___bank_script_1, _script_1",
    "",
  ]);
  expect(output2).toEqual([
    "        ; Call Script: Script 2",
    "        VM_PUSH_CONST           1 ; Actor 0",
    "        VM_CALL_FAR             ___bank_script_2, _script_2",
    "",
  ]);
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `___bank_script_input, _script_input`,
  );
  expect(additionalScripts["script_1"]?.compiledScript).not.toContain(
    `___bank_script_input_0, _script_input_0`,
  );
  expect(additionalScripts["script_2"]?.compiledScript).toContain(
    `___bank_script_input, _script_input`,
  );
  expect(additionalScripts["script_2"]?.compiledScript).not.toContain(
    `___bank_script_input_0, _script_input_0`,
  );
});

test("should insert placeholder symbol for recursive scripts", async () => {
  const output: string[] = [];
  const additionalScripts: Record<
    string,
    {
      symbol: string;
      compiledScript: string;
    }
  > = {};
  const recursiveSymbolMap: Record<string, string> = {};
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    additionalScripts,
    recursiveSymbolMap,
    scene: {
      id: "scene1",
      hash: "scene1",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents: [
      {
        id: "script1",
        name: "Script 1",
        description: "",
        variables: {},
        actors: {
          "0": {
            id: "0",
            name: "Actor1",
          },
        },
        symbol: "script_1",
        script: [
          {
            command: "EVENT_TEXT",
            args: {
              text: "Hello World",
            },
            id: "event1",
          },
          {
            command: "EVENT_CALL_CUSTOM_EVENT",
            args: {
              customEventId: "script1",
            },
            id: "event2",
          },
        ],
      },
    ],
  } as unknown as ScriptBuilderOptions);
  sb.callScript("script1", {
    "$actor[0]$": "actorS0A0",
  });

  const additionalScriptFiles = Object.keys(additionalScripts);
  const placeholder = Object.keys(recursiveSymbolMap)[0];
  expect(placeholder).toContain("PLACEHOLDER");
  expect(additionalScriptFiles.length).toEqual(1);
  expect(output).toEqual([
    "        ; Call Script: Script 1",
    "        VM_PUSH_CONST           1 ; Actor 0",
    "        VM_CALL_FAR             ___bank_script_1, _script_1",
    "",
  ]);
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `VM_CALL_FAR             ___bank_${placeholder}, _${placeholder}`,
  );
  expect(additionalScripts["script_1"]?.compiledScript).not.toContain(
    `VM_CALL_FAR             ___bank_script`,
  );
  expect(recursiveSymbolMap[placeholder ?? ""]).toEqual("script_1");
});

test("should NOT reuse script symbol even if scene hashes are different as long as scripts are identical", async () => {
  const output: string[] = [];
  const output2: string[] = [];
  const symbols: Record<string, string> = {};
  const additionalScripts: Record<
    string,
    {
      symbol: string;
      compiledScript: string;
    }
  > = {};
  const additionalScriptsCache: Record<string, string> = {};

  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    additionalScripts,
    additionalScriptsCache,
    symbols,
    scene: {
      id: "scene1",
      hash: "scene1",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents: [
      {
        id: "script1",
        name: "Script 1",
        description: "",
        variables: {},
        actors: {
          "0": {
            id: "0",
            name: "Actor1",
          },
        },
        symbol: "script_1",
        script: [
          {
            command: "EVENT_IDLE",
            args: {},
            id: "event1",
          },
        ],
      },
    ],
  } as unknown as ScriptBuilderOptions);

  const sb2 = new ScriptBuilder(output2, {
    scriptEventHandlers,
    additionalScripts,
    additionalScriptsCache,
    symbols,
    scene: {
      id: "scene2",
      hash: "scene2",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents: [
      {
        id: "script2",
        name: "Script 2",
        description: "",
        variables: {},
        actors: {
          "0": {
            id: "0",
            name: "Actor1",
          },
        },
        symbol: "script_2",
        script: [
          {
            command: "EVENT_IDLE",
            args: {},
            id: "event2",
          },
        ],
      },
    ],
  } as unknown as ScriptBuilderOptions);

  sb.callScript("script1", {
    "$actor[0]$": "actorS0A0",
  });

  sb2.callScript("script2", {
    "$actor[0]$": "actorS0A0",
  });

  const additionalScriptFiles = Object.keys(additionalScripts);
  expect(additionalScriptFiles.length).toEqual(2);
  expect(output).toEqual([
    "        ; Call Script: Script 1",
    "        VM_PUSH_CONST           1 ; Actor 0",
    "        VM_CALL_FAR             ___bank_script_1, _script_1",
    "",
  ]);
  expect(output2).toEqual([
    "        ; Call Script: Script 2",
    "        VM_PUSH_CONST           1 ; Actor 0",
    "        VM_CALL_FAR             ___bank_script_2, _script_2",
    "",
  ]);
  expect(additionalScripts["script_1"]?.compiledScript).toContain(`VM_IDLE`);
  expect(additionalScripts["script_2"]?.compiledScript).toContain(`VM_IDLE`);
});

test("should reuse script symbol even if scene hashes are different when the same script is being called and the output is identical", async () => {
  const output: string[] = [];
  const output2: string[] = [];
  const symbols: Record<string, string> = {};
  const additionalScripts: Record<
    string,
    {
      symbol: string;
      compiledScript: string;
    }
  > = {};
  const additionalScriptsCache: Record<string, string> = {};

  const customEvents: Script[] = [
    {
      id: "script1",
      name: "Script 1",
      description: "",
      variables: {},
      actors: {
        "0": {
          id: "0",
          name: "Actor1",
        },
      },
      symbol: "script_1",
      script: [
        {
          command: "EVENT_IDLE",
          args: {},
          id: "event1",
        },
      ],
    },
  ];

  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    additionalScripts,
    additionalScriptsCache,
    symbols,
    scene: {
      id: "scene1",
      hash: "scene1",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents,
  } as unknown as ScriptBuilderOptions);

  const sb2 = new ScriptBuilder(output2, {
    scriptEventHandlers,
    additionalScripts,
    additionalScriptsCache,
    symbols,
    scene: {
      id: "scene2",
      hash: "scene2",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents,
  } as unknown as ScriptBuilderOptions);

  sb.callScript("script1", {
    "$actor[0]$": "actorS0A0",
  });

  sb2.callScript("script1", {
    "$actor[0]$": "actorS0A0",
  });

  const additionalScriptFiles = Object.keys(additionalScripts);
  expect(additionalScriptFiles.length).toEqual(1);
  expect(output).toEqual([
    "        ; Call Script: Script 1",
    "        VM_PUSH_CONST           1 ; Actor 0",
    "        VM_CALL_FAR             ___bank_script_1, _script_1",
    "",
  ]);
  expect(output2).toEqual([
    "        ; Call Script: Script 1",
    "        VM_PUSH_CONST           1 ; Actor 0",
    "        VM_CALL_FAR             ___bank_script_1, _script_1",
    "",
  ]);
  expect(additionalScripts["script_1"]?.compiledScript).toContain(`VM_IDLE`);
});

test("should NOT reuse script symbol even if scene hashes are different causing the same script to be compiled with different output", async () => {
  const output: string[] = [];
  const output2: string[] = [];
  const symbols: Record<string, string> = {};
  const additionalScripts: Record<
    string,
    {
      symbol: string;
      compiledScript: string;
    }
  > = {};
  const additionalScriptsCache: Record<string, string> = {};

  const customEvents: Script[] = [
    {
      id: "script1",
      name: "Script 1",
      description: "",
      variables: {},
      actors: {
        "0": {
          id: "0",
          name: "Actor1",
        },
      },
      symbol: "script_1",
      script: [
        {
          command: "EVENT_PALETTE_SET_BACKGROUND",
          args: {
            palette0: "restore",
          },
          id: "event1",
        },
      ],
    },
  ];

  const palettes = [
    {
      id: "palette1",
      colors: ["F30000", "C80000", "110000", "D20000"],
    },
    {
      id: "palette2",
      colors: ["00F300", "00B800", "000011", "00D800"],
    },
  ];

  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    additionalScripts,
    additionalScriptsCache,
    symbols,
    palettes,
    scene: {
      id: "scene1",
      hash: "scene1",
      background: { autoPalettes: false },
      paletteIds: ["palette1"],
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents,
  } as unknown as ScriptBuilderOptions);

  const sb2 = new ScriptBuilder(output2, {
    scriptEventHandlers,
    additionalScripts,
    additionalScriptsCache,
    symbols,
    palettes,
    scene: {
      id: "scene2",
      hash: "scene2",
      background: { autoPalettes: false },
      paletteIds: ["palette2"],
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents,
  } as unknown as ScriptBuilderOptions);

  sb.callScript("script1", {
    "$actor[0]$": "actorS0A0",
  });

  sb2.callScript("script1", {
    "$actor[0]$": "actorS0A0",
  });

  const additionalScriptFiles = Object.keys(additionalScripts);
  expect(additionalScriptFiles.length).toEqual(2);
  expect(output).toEqual([
    "        ; Call Script: Script 1",
    "        VM_PUSH_CONST           1 ; Actor 0",
    "        VM_CALL_FAR             ___bank_script_1, _script_1",
    "",
  ]);
  expect(output2).toEqual([
    "        ; Call Script: Script 1",
    "        VM_PUSH_CONST           1 ; Actor 0",
    "        VM_CALL_FAR             ___bank_script_1_0, _script_1_0",
    "",
  ]);
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `VM_LOAD_PALETTE`,
  );
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `30, 0, 1, 25, 0, 1, 2, 0, 1, 26, 0, 1`,
  );
  expect(additionalScripts["script_1_0"]?.compiledScript).toContain(
    `VM_LOAD_PALETTE`,
  );
  expect(additionalScripts["script_1_0"]?.compiledScript).toContain(
    `0, 30, 1, 0, 23, 1, 0, 0, 2, 0, 27, 1`,
  );
});

test("should not reused script symbol when scripts are not identical", async () => {
  const output: string[] = [];
  const output2: string[] = [];
  const symbols: Record<string, string> = {};
  const additionalScripts: Record<
    string,
    {
      symbol: string;
      compiledScript: string;
    }
  > = {};
  const additionalScriptsCache: Record<string, string> = {};

  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    additionalScripts,
    additionalScriptsCache,
    symbols,
    scene: {
      id: "scene1",
      hash: "scene1",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents: [
      {
        id: "script1",
        name: "Script 1",
        description: "",
        variables: {},
        actors: {
          "0": {
            id: "0",
            name: "Actor1",
          },
        },
        symbol: "script_1",
        script: [
          {
            command: "EVENT_IDLE",
            args: {},
            id: "event1",
          },
        ],
      },
    ],
  } as unknown as ScriptBuilderOptions);

  const sb2 = new ScriptBuilder(output2, {
    scriptEventHandlers,
    additionalScripts,
    additionalScriptsCache,
    symbols,
    scene: {
      id: "scene2",
      hash: "scene2",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents: [
      {
        id: "script2",
        name: "Script 2",
        description: "",
        variables: {},
        actors: {
          "0": {
            id: "0",
            name: "Actor1",
          },
        },
        symbol: "script_2",
        script: [
          {
            command: "EVENT_RNG_SEED",
            args: {},
            id: "event2",
          },
        ],
      },
    ],
  } as unknown as ScriptBuilderOptions);

  sb.callScript("script1", {
    "$actor[0]$": "actorS0A0",
  });

  sb2.callScript("script2", {
    "$actor[0]$": "actorS0A0",
  });

  const additionalScriptFiles = Object.keys(additionalScripts);
  expect(additionalScriptFiles.length).toEqual(2);
  expect(output).toEqual([
    "        ; Call Script: Script 1",
    "        VM_PUSH_CONST           1 ; Actor 0",
    "        VM_CALL_FAR             ___bank_script_1, _script_1",
    "",
  ]);
  expect(output2).toEqual([
    "        ; Call Script: Script 2",
    "        VM_PUSH_CONST           1 ; Actor 0",
    "        VM_CALL_FAR             ___bank_script_2, _script_2",
    "",
  ]);
  expect(additionalScripts["script_1"]?.compiledScript).toContain(`VM_IDLE`);
  expect(additionalScripts["script_2"]?.compiledScript).not.toContain(
    `VM_IDLE`,
  );
  expect(additionalScripts["script_2"]?.compiledScript).toContain(
    `VM_RANDOMIZE`,
  );
  expect(additionalScripts["script_1"]?.compiledScript).not.toContain(
    `VM_RANDOMIZE`,
  );
});

test("should allow pass by reference for recursive scripts", async () => {
  const output: string[] = [];
  const additionalScripts: Record<
    string,
    {
      symbol: string;
      compiledScript: string;
    }
  > = {};
  const recursiveSymbolMap: Record<string, string> = {};
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    additionalScripts,
    recursiveSymbolMap,
    scene: {
      id: "scene1",
      hash: "scene1",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents: [
      {
        id: "script1",
        name: "Script 1",
        description: "",
        variables: {
          V0: {
            id: "V0",
            name: "Variable A",
            passByReference: true,
          },
        },
        actors: {
          "0": {
            id: "0",
            name: "Actor1",
          },
        },
        symbol: "script_1",
        script: [
          {
            command: "EVENT_TEXT",
            args: {
              text: "Hello World $V0$",
            },
            id: "event1",
          },
          {
            command: "EVENT_CALL_CUSTOM_EVENT",
            args: {
              customEventId: "script1",
              "$variable[V0]$": {
                type: "sub",
                valueA: {
                  type: "variable",
                  value: "V0",
                },
                valueB: {
                  type: "number",
                  value: 1,
                },
              },
            },
            id: "event2",
          },
        ],
      },
    ],
  } as unknown as ScriptBuilderOptions);
  sb.callScript("script1", {
    "$actor[0]$": "actorS0A0",
    "$variable[V0]$": "0",
  });

  const additionalScriptFiles = Object.keys(additionalScripts);
  const placeholder = Object.keys(recursiveSymbolMap)[0];

  expect(additionalScriptFiles.length).toEqual(1);
  expect(output).toEqual([
    "        ; Call Script: Script 1",
    "        VM_PUSH_CONST           1 ; Actor 0",
    "        VM_PUSH_CONST           VAR_VARIABLE_0 ; Variable V0",
    "        VM_CALL_FAR             ___bank_script_1, _script_1",
    "",
  ]);
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `.R_REF_IND  .SCRIPT_ARG_INDIRECT_0_VARIABLE`,
  );
  expect(additionalScripts["script_1"]?.compiledScript).not.toContain(
    `.R_REF      .SCRIPT_ARG_0_VARIABLE`,
  );
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `VM_CALL_FAR             ___bank_${placeholder}, _${placeholder}`,
  );
  expect(recursiveSymbolMap[placeholder ?? ""]).toEqual("script_1");
});

test("should allow pass by value for recursive scripts", async () => {
  const output: string[] = [];
  const additionalScripts: Record<
    string,
    {
      symbol: string;
      compiledScript: string;
    }
  > = {};
  const recursiveSymbolMap: Record<string, string> = {};
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    additionalScripts,
    recursiveSymbolMap,
    scene: {
      id: "scene1",
      hash: "scene1",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents: [
      {
        id: "script1",
        name: "Script 1",
        description: "",
        variables: {
          V0: {
            id: "V0",
            name: "Variable A",
            passByReference: false,
          },
        },
        actors: {
          "0": {
            id: "0",
            name: "Actor1",
          },
        },
        symbol: "script_1",
        script: [
          {
            command: "EVENT_TEXT",
            args: {
              text: "Hello World $V0$",
            },
            id: "event1",
          },
          {
            command: "EVENT_CALL_CUSTOM_EVENT",
            args: {
              customEventId: "script1",
              "$variable[V0]$": {
                type: "sub",
                valueA: {
                  type: "variable",
                  value: "V0",
                },
                valueB: {
                  type: "number",
                  value: 1,
                },
              },
            },
            id: "event2",
          },
        ],
      },
    ],
  } as unknown as ScriptBuilderOptions);
  sb.callScript("script1", {
    "$actor[0]$": "actorS0A0",
    "$variable[V0]$": "0",
  });

  const additionalScriptFiles = Object.keys(additionalScripts);
  const placeholder = Object.keys(recursiveSymbolMap)[0];
  expect(additionalScriptFiles.length).toEqual(1);
  expect(output).toEqual([
    "        ; Call Script: Script 1",
    "        VM_PUSH_CONST           1 ; Actor 0",
    "        VM_PUSH_VALUE           VAR_VARIABLE_0",
    "        VM_CALL_FAR             ___bank_script_1, _script_1",
    "",
  ]);

  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `.R_REF      .SCRIPT_ARG_0_VARIABLE`,
  );
  expect(additionalScripts["script_1"]?.compiledScript).not.toContain(
    `.R_REF_IND  .SCRIPT_ARG_INDIRECT_0_VARIABLE`,
  );
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `VM_CALL_FAR             ___bank_${placeholder}, _${placeholder}`,
  );
  expect(recursiveSymbolMap[placeholder ?? ""]).toEqual("script_1");
});

test("should allow pass by reference between multiple scripts", async () => {
  const output: string[] = [];
  const additionalScripts: Record<
    string,
    {
      symbol: string;
      compiledScript: string;
    }
  > = {};
  const recursiveSymbolMap: Record<string, string> = {};
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    additionalScripts,
    recursiveSymbolMap,
    scene: {
      id: "scene1",
      hash: "scene1",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents: [
      {
        id: "script1",
        name: "Script 1",
        description: "",
        variables: {
          V0: {
            id: "V0",
            name: "Variable A",
            passByReference: true,
          },
        },
        actors: {},
        symbol: "script_1",
        script: [
          {
            command: "EVENT_INC_VALUE",
            args: {
              variable: "V0",
            },
            id: "event1",
          },
        ],
      },
      {
        id: "script2",
        name: "Script 2",
        description: "",
        variables: {
          V0: {
            id: "V0",
            name: "Variable A",
            passByReference: true,
          },
        },
        actors: {},
        symbol: "script_2",
        script: [
          {
            command: "EVENT_CALL_CUSTOM_EVENT",
            args: {
              customEventId: "script1",
              "$variable[V0]$": {
                type: "variable",
                value: "V0",
              },
            },
            id: "event2",
          },
        ],
      },
    ],
  } as unknown as ScriptBuilderOptions);

  sb.callScript("script2", {
    "$variable[V0]$": "0",
  });

  const additionalScriptFiles = Object.keys(additionalScripts);
  expect(additionalScriptFiles.length).toEqual(2);

  expect(output).toEqual([
    "        ; Call Script: Script 2",
    "        VM_PUSH_CONST           VAR_VARIABLE_0 ; Variable V0",
    "        VM_CALL_FAR             ___bank_script_2, _script_2",
    "",
  ]);

  // Read indirect value from arg
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `.R_REF_IND  .SCRIPT_ARG_INDIRECT_0_VARIABLE`,
  );

  // Write indirect value back to arg
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `.R_REF_SET_IND .SCRIPT_ARG_INDIRECT_0_VARIABLE`,
  );

  // Pass indirect value address
  expect(additionalScripts["script_2"]?.compiledScript).toContain(
    [
      `        ; Call Script: Script 1`,
      `        VM_PUSH_VALUE           .SCRIPT_ARG_INDIRECT_0_VARIABLE`,
      `        VM_CALL_FAR             ___bank_script_1, _script_1`,
    ].join("\n"),
  );
});

test("should allow pass by reference to pass by value between multiple scripts", async () => {
  const output: string[] = [];
  const additionalScripts: Record<
    string,
    {
      symbol: string;
      compiledScript: string;
    }
  > = {};
  const recursiveSymbolMap: Record<string, string> = {};
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    additionalScripts,
    recursiveSymbolMap,
    scene: {
      id: "scene1",
      hash: "scene1",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents: [
      {
        id: "script1",
        name: "Script 1",
        description: "",
        variables: {
          V0: {
            id: "V0",
            name: "Variable A",
            passByReference: false,
          },
        },
        actors: {},
        symbol: "script_1",
        script: [
          {
            command: "EVENT_INC_VALUE",
            args: {
              variable: "V0",
            },
            id: "event1",
          },
        ],
      },
      {
        id: "script2",
        name: "Script 2",
        description: "",
        variables: {
          V0: {
            id: "V0",
            name: "Variable A",
            passByReference: true,
          },
        },
        actors: {},
        symbol: "script_2",
        script: [
          {
            command: "EVENT_CALL_CUSTOM_EVENT",
            args: {
              customEventId: "script1",
              "$variable[V0]$": {
                type: "variable",
                value: "V0",
              },
            },
            id: "event2",
          },
        ],
      },
    ],
  } as unknown as ScriptBuilderOptions);

  sb.callScript("script2", {
    "$variable[V0]$": "0",
  });

  const additionalScriptFiles = Object.keys(additionalScripts);
  expect(additionalScriptFiles.length).toEqual(2);

  expect(output).toEqual([
    "        ; Call Script: Script 2",
    "        VM_PUSH_CONST           VAR_VARIABLE_0 ; Variable V0",
    "        VM_CALL_FAR             ___bank_script_2, _script_2",
    "",
  ]);

  // Read value from arg
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `.R_REF      .SCRIPT_ARG_0_VARIABLE`,
  );

  // Write value back to arg
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `.R_REF_SET  .SCRIPT_ARG_0_VARIABLE`,
  );

  // Pass variable value
  expect(additionalScripts["script_2"]?.compiledScript).toContain(
    [
      `        ; Call Script: Script 1`,
      `        VM_PUSH_VALUE_IND       .SCRIPT_ARG_INDIRECT_0_VARIABLE`,
      `        VM_CALL_FAR             ___bank_script_1, _script_1`,
    ].join("\n"),
  );
});

test("should allow pass by value to pass by reference between multiple scripts", async () => {
  const output: string[] = [];
  const additionalScripts: Record<
    string,
    {
      symbol: string;
      compiledScript: string;
    }
  > = {};
  const recursiveSymbolMap: Record<string, string> = {};
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    additionalScripts,
    recursiveSymbolMap,
    scene: {
      id: "scene1",
      hash: "scene1",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents: [
      {
        id: "script1",
        name: "Script 1",
        description: "",
        variables: {
          V0: {
            id: "V0",
            name: "Variable A",
            passByReference: true,
          },
        },
        actors: {},
        symbol: "script_1",
        script: [
          {
            command: "EVENT_INC_VALUE",
            args: {
              variable: "V0",
            },
            id: "event1",
          },
        ],
      },
      {
        id: "script2",
        name: "Script 2",
        description: "",
        variables: {
          V0: {
            id: "V0",
            name: "Variable A",
            passByReference: false,
          },
        },
        actors: {},
        symbol: "script_2",
        script: [
          {
            command: "EVENT_CALL_CUSTOM_EVENT",
            args: {
              customEventId: "script1",
              "$variable[V0]$": {
                type: "variable",
                value: "V0",
              },
            },
            id: "event2",
          },
        ],
      },
    ],
  } as unknown as ScriptBuilderOptions);

  sb.callScript("script2", {
    "$variable[V0]$": "0",
  });

  const additionalScriptFiles = Object.keys(additionalScripts);
  expect(additionalScriptFiles.length).toEqual(2);

  expect(output).toEqual([
    "        ; Call Script: Script 2",
    "        VM_PUSH_VALUE           VAR_VARIABLE_0",
    "        VM_CALL_FAR             ___bank_script_2, _script_2",
    "",
  ]);

  // Read indirect value from arg
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `.R_REF_IND  .SCRIPT_ARG_INDIRECT_0_VARIABLE`,
  );

  // Write indirect value back to arg
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `.R_REF_SET_IND .SCRIPT_ARG_INDIRECT_0_VARIABLE`,
  );

  // Pass indirect value address
  expect(additionalScripts["script_2"]?.compiledScript).toContain(
    [
      `        ; Call Script: Script 1`,
      `        VM_PUSH_REFERENCE       .SCRIPT_ARG_0_VARIABLE ; Variable V0`,
      `        VM_CALL_FAR             ___bank_script_1, _script_1`,
    ].join("\n"),
  );
});

test("should allow pass by value between multiple scripts", async () => {
  const output: string[] = [];
  const additionalScripts: Record<
    string,
    {
      symbol: string;
      compiledScript: string;
    }
  > = {};
  const recursiveSymbolMap: Record<string, string> = {};
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    additionalScripts,
    recursiveSymbolMap,
    scene: {
      id: "scene1",
      hash: "scene1",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents: [
      {
        id: "script1",
        name: "Script 1",
        description: "",
        variables: {
          V0: {
            id: "V0",
            name: "Variable A",
            passByReference: false,
          },
        },
        actors: {},
        symbol: "script_1",
        script: [
          {
            command: "EVENT_INC_VALUE",
            args: {
              variable: "V0",
            },
            id: "event1",
          },
        ],
      },
      {
        id: "script2",
        name: "Script 2",
        description: "",
        variables: {
          V0: {
            id: "V0",
            name: "Variable A",
            passByReference: false,
          },
        },
        actors: {},
        symbol: "script_2",
        script: [
          {
            command: "EVENT_CALL_CUSTOM_EVENT",
            args: {
              customEventId: "script1",
              "$variable[V0]$": {
                type: "variable",
                value: "V0",
              },
            },
            id: "event2",
          },
        ],
      },
    ],
  } as unknown as ScriptBuilderOptions);

  sb.callScript("script2", {
    "$variable[V0]$": "0",
  });

  const additionalScriptFiles = Object.keys(additionalScripts);
  expect(additionalScriptFiles.length).toEqual(2);

  expect(output).toEqual([
    "        ; Call Script: Script 2",
    "        VM_PUSH_VALUE           VAR_VARIABLE_0",
    "        VM_CALL_FAR             ___bank_script_2, _script_2",
    "",
  ]);

  // Read value from arg
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `.R_REF      .SCRIPT_ARG_0_VARIABLE`,
  );

  // Write value back to arg
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `.R_REF_SET  .SCRIPT_ARG_0_VARIABLE`,
  );

  // Pass indirect value address
  expect(additionalScripts["script_2"]?.compiledScript).toContain(
    [
      `        ; Call Script: Script 1`,
      `        VM_PUSH_VALUE           .SCRIPT_ARG_0_VARIABLE`,
      `        VM_CALL_FAR             ___bank_script_1, _script_1`,
    ].join("\n"),
  );
});

test("Should compile variable data table lookups into data table output", async () => {
  const { sb } = await createTestScriptBuilder();

  sb.variableDataTableLookup("0", {
    variables: [
      { type: "variable", value: "1" },
      { type: "variable", value: "2" },
    ],
    rows: [
      {
        label: "Alpha",
        values: [
          { type: "number", value: 10 },
          { type: "number", value: 20 },
        ],
      },
      {
        label: "Beta",
        values: [{ type: "number", value: 30 }, undefined],
      },
    ],
  });
  sb._packLocals();

  const script = sb.toScriptString("DATA_TABLE_SCRIPT", false);

  expect(script).toContain("        ; Variable Data Table");
  expect(script).toContain("data_table:");
  expect(script).toContain("\t; Alpha\n\t.dw 10, 20");
  expect(script).toContain("\t; Beta\n\t.dw 30, 0");
  expect(script).toContain("VAR_VARIABLE_0");
  expect(script).toContain("VAR_VARIABLE_1");
  expect(script).toContain("VAR_VARIABLE_2");
});

test("Should compile data table lookups into fixed array elements", async () => {
  const arrayId = "11111111-1111-1111-1111-111111111111";
  const { sb, output } = await createTestScriptBuilder(
    {},
    {
      variablesLookup: {
        [arrayId]: {
          id: arrayId,
          name: "Array",
          symbol: "var_array",
          type: "array",
          length: 4,
        },
      },
    },
  );

  sb.variableDataTableLookup("0", {
    variables: [
      {
        type: "variable",
        value: arrayId,
        index: { type: "number", value: 2 },
      },
    ],
    rows: [{ values: [{ type: "number", value: 10 }] }],
  });

  expect(output.join("\n")).toContain("^/(VAR_ARRAY + 2)/");
});

test("Should remap custom event variable arguments used in data table columns", async () => {
  const arrayId = "11111111-1111-1111-1111-111111111111";
  const output: string[] = [];
  const additionalScripts: Record<
    string,
    {
      symbol: string;
      compiledScript: string;
    }
  > = {};
  const scriptEventHandlers = await getTestScriptHandlers();

  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    additionalScripts,
    scene: {
      id: "scene1",
      hash: "scene1",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents: [
      {
        id: "script1",
        name: "Script 1",
        description: "",
        variables: {
          V0: {
            id: "V0",
            name: "Variable A",
            passByReference: false,
          },
          V1: {
            id: "V1",
            name: "Array Variable",
            passByReference: "array",
          },
        },
        actors: {},
        symbol: "script_1",
        script: [
          {
            command: "EVENT_DATA_TABLE",
            args: {
              indexVariable: "0",
              data: {
                variables: [
                  { type: "variable", value: "V0" },
                  {
                    type: "variable",
                    value: "V1",
                    index: { type: "number", value: 2 },
                  },
                  { type: "variable", value: "1" },
                ],
                rows: [
                  {
                    label: "Row 1",
                    values: [
                      { type: "number", value: 5 },
                      { type: "number", value: 6 },
                      { type: "number", value: 7 },
                    ],
                  },
                ],
              },
            },
            id: "event1",
          },
        ],
      },
    ],
    variablesLookup: {
      [arrayId]: {
        id: arrayId,
        name: "Array",
        symbol: "var_array",
        type: "array",
        length: 4,
      },
    },
  } as unknown as ScriptBuilderOptions);

  sb.callScript("script1", {
    "$variable[V0]$": "2",
    "$variable[V1]$": arrayId,
  });

  expect(output).toContain("        VM_PUSH_VALUE           VAR_VARIABLE_2");
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    "VAR_VARIABLE_1",
  );
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    ".SCRIPT_ARG_0_VARIABLE",
  );
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    [
      "            .R_REF      .SCRIPT_ARG_INDIRECT_1_VARIABLE",
      "            .R_INT16    2",
      "            .R_OPERATOR .ADD",
      "            .R_REF_SET  .LOCAL_TMP1_ARRAY_PTR",
    ].join("\n"),
  );
});

test("should allow pass by reference of script value between multiple scripts", async () => {
  const output: string[] = [];
  const additionalScripts: Record<
    string,
    {
      symbol: string;
      compiledScript: string;
    }
  > = {};
  const recursiveSymbolMap: Record<string, string> = {};
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    additionalScripts,
    recursiveSymbolMap,
    scene: {
      id: "scene1",
      hash: "scene1",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents: [
      {
        id: "script1",
        name: "Script 1",
        description: "",
        variables: {
          V0: {
            id: "V0",
            name: "Variable A",
            passByReference: true,
          },
        },
        actors: {},
        symbol: "script_1",
        script: [
          {
            command: "EVENT_INC_VALUE",
            args: {
              variable: "V0",
            },
            id: "event1",
          },
        ],
      },
      {
        id: "script2",
        name: "Script 2",
        description: "",
        variables: {
          V0: {
            id: "V0",
            name: "Variable A",
            passByReference: true,
          },
        },
        actors: {},
        symbol: "script_2",
        script: [
          {
            command: "EVENT_CALL_CUSTOM_EVENT",
            args: {
              customEventId: "script1",
              "$variable[V0]$": {
                type: "variable",
                value: "V0",
              },
            },
            id: "event2",
          },
        ],
      },
    ],
  } as unknown as ScriptBuilderOptions);

  sb.callScript("script2", {
    "$variable[V0]$": {
      type: "add",
      valueA: {
        type: "variable",
        value: "0",
      },
      valueB: {
        type: "number",
        value: 5,
      },
    },
  });

  const additionalScriptFiles = Object.keys(additionalScripts);
  expect(additionalScriptFiles.length).toEqual(2);

  expect(output).toEqual([
    "        ; Call Script: Script 2",
    "        ; -- Calculate value",
    "        VM_RPN",
    "            .R_REF      VAR_VARIABLE_0",
    "            .R_INT16    5",
    "            .R_OPERATOR .ADD",
    "            .R_REF_SET  .LOCAL_TMP0_ARG",
    "            .R_STOP",
    "        VM_PUSH_REFERENCE       .LOCAL_TMP0_ARG ; Variable V0",
    "        VM_CALL_FAR             ___bank_script_2, _script_2",
    "",
  ]);

  // Read indirect value from arg
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `.R_REF_IND  .SCRIPT_ARG_INDIRECT_0_VARIABLE`,
  );

  // Write indirect value back to arg
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `.R_REF_SET_IND .SCRIPT_ARG_INDIRECT_0_VARIABLE`,
  );

  // Pass indirect value address
  expect(additionalScripts["script_2"]?.compiledScript).toContain(
    [
      `        ; Call Script: Script 1`,
      `        VM_PUSH_VALUE           .SCRIPT_ARG_INDIRECT_0_VARIABLE`,
      `        VM_CALL_FAR             ___bank_script_1, _script_1`,
    ].join("\n"),
  );
});

test("should allow pass by value of script value between multiple scripts", async () => {
  const output: string[] = [];
  const additionalScripts: Record<
    string,
    {
      symbol: string;
      compiledScript: string;
    }
  > = {};
  const recursiveSymbolMap: Record<string, string> = {};
  const scriptEventHandlers = await getTestScriptHandlers();
  const sb = new ScriptBuilder(output, {
    scriptEventHandlers,
    additionalScripts,
    recursiveSymbolMap,
    scene: {
      id: "scene1",
      hash: "scene1",
      actors: [{ ...dummyActorNormalized, id: "actorS0A0" }],
    } as unknown as PrecompiledScene,
    customEvents: [
      {
        id: "script1",
        name: "Script 1",
        description: "",
        variables: {
          V0: {
            id: "V0",
            name: "Variable A",
            passByReference: false,
          },
        },
        actors: {},
        symbol: "script_1",
        script: [
          {
            command: "EVENT_INC_VALUE",
            args: {
              variable: "V0",
            },
            id: "event1",
          },
        ],
      },
      {
        id: "script2",
        name: "Script 2",
        description: "",
        variables: {
          V0: {
            id: "V0",
            name: "Variable A",
            passByReference: false,
          },
        },
        actors: {},
        symbol: "script_2",
        script: [
          {
            command: "EVENT_CALL_CUSTOM_EVENT",
            args: {
              customEventId: "script1",
              "$variable[V0]$": {
                type: "variable",
                value: "V0",
              },
            },
            id: "event2",
          },
        ],
      },
    ],
  } as unknown as ScriptBuilderOptions);

  sb.callScript("script2", {
    "$variable[V0]$": {
      type: "add",
      valueA: {
        type: "variable",
        value: "0",
      },
      valueB: {
        type: "number",
        value: 5,
      },
    },
  });

  const additionalScriptFiles = Object.keys(additionalScripts);
  expect(additionalScriptFiles.length).toEqual(2);

  expect(output).toEqual([
    "        ; Call Script: Script 2",
    "        ; -- Calculate value",
    "        VM_RPN",
    "            .R_REF      VAR_VARIABLE_0",
    "            .R_INT16    5",
    "            .R_OPERATOR .ADD",
    "            .R_REF_SET  .LOCAL_TMP0_ARG",
    "            .R_STOP",
    "        VM_PUSH_VALUE           .LOCAL_TMP0_ARG",
    "        VM_CALL_FAR             ___bank_script_2, _script_2",
    "",
  ]);

  // Read value from arg
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `.R_REF      .SCRIPT_ARG_0_VARIABLE`,
  );

  // Write value back to arg
  expect(additionalScripts["script_1"]?.compiledScript).toContain(
    `.R_REF_SET  .SCRIPT_ARG_0_VARIABLE`,
  );

  // Pass indirect value address
  expect(additionalScripts["script_2"]?.compiledScript).toContain(
    [
      `        ; Call Script: Script 1`,
      `        VM_PUSH_VALUE           .SCRIPT_ARG_0_VARIABLE`,
      `        VM_CALL_FAR             ___bank_script_1, _script_1`,
    ].join("\n"),
  );
});

describe("_getAvailableSymbol", () => {
  test("should return symbol if available", async () => {
    const output: string[] = [];
    const scriptEventHandlers = await getTestScriptHandlers();
    const sb = new ScriptBuilder(output, {
      scriptEventHandlers,
      scene: {} as unknown as PrecompiledScene,
      symbols: {},
    });
    const symbol = sb._getAvailableSymbol("script_0");
    expect(symbol).toEqual("script_0");
  });

  test("should return incremented symbol if suggested symbol was already taken", async () => {
    const output: string[] = [];
    const scriptEventHandlers = await getTestScriptHandlers();
    const sb = new ScriptBuilder(output, {
      scriptEventHandlers,
      scene: {} as unknown as PrecompiledScene,
      // eslint-disable-next-line camelcase
      symbols: { script_0: "script_0" },
    });
    const symbolA = sb._getAvailableSymbol("script_0");
    const symbolB = sb._getAvailableSymbol("script_0");
    const symbolC = sb._getAvailableSymbol("script_0");
    const symbolD = sb._getAvailableSymbol("script_1");
    const symbolE = sb._getAvailableSymbol("script_1");

    expect(symbolA).toEqual("script_0_0");
    expect(symbolB).toEqual("script_0_1");
    expect(symbolC).toEqual("script_0_2");
    expect(symbolD).toEqual("script_1");
    expect(symbolE).toEqual("script_1_0");
  });
});

describe("_compileSubScript", () => {
  test("should compile subscript", async () => {
    const output: string[] = [];
    const scriptEventHandlers = await getTestScriptHandlers();
    const sb = new ScriptBuilder(output, {
      scriptEventHandlers,
      scene: {} as unknown as PrecompiledScene,
      symbols: {},
    });
    const symbol = sb._compileSubScript(
      "input",
      [
        {
          id: "event1",
          command: "EVENT_IDLE",
        },
      ],
      "script_input_0",
      sb.options,
    );
    expect(symbol).toEqual("script_input_0");
    expect(
      sb.options.additionalScripts["script_input_0"]?.compiledScript,
    ).toContain("script_input_0::");
    expect(
      sb.options.additionalScripts["script_input_0"]?.compiledScript,
    ).toContain("VM_IDLE");
  });

  test("should resuse symbol for identical subscript", async () => {
    const output: string[] = [];
    const scriptEventHandlers = await getTestScriptHandlers();
    const sb = new ScriptBuilder(output, {
      scriptEventHandlers,
      scene: {} as unknown as PrecompiledScene,
      symbols: {},
    });
    const symbolA = sb._compileSubScript(
      "input",
      [
        {
          id: "event1",
          command: "EVENT_IDLE",
        },
      ],
      "script_input_0",
      sb.options,
    );
    const symbolB = sb._compileSubScript(
      "input",
      [
        {
          id: "event1",
          command: "EVENT_IDLE",
        },
      ],
      "script_input_1",
      sb.options,
    );
    expect(symbolA).toEqual("script_input_0");
    expect(symbolB).toEqual("script_input_0");
    expect(
      sb.options.additionalScripts["script_input_0"]?.compiledScript,
    ).toContain("script_input_0::");
    expect(
      sb.options.additionalScripts["script_input_0"]?.compiledScript,
    ).toContain("VM_IDLE");
    expect(sb.options.additionalScripts["script_input_1"]).toBeFalsy();
  });

  test("should not resuse symbol for identical custom script", async () => {
    const output: string[] = [];
    const scriptEventHandlers = await getTestScriptHandlers();
    const sb = new ScriptBuilder(output, {
      scriptEventHandlers,
      scene: {} as unknown as PrecompiledScene,
      symbols: {},
    });
    const symbolA = sb._compileSubScript(
      "custom",
      [
        {
          id: "event1",
          command: "EVENT_IDLE",
        },
      ],
      "script_input_0",
      sb.options,
    );
    const symbolB = sb._compileSubScript(
      "custom",
      [
        {
          id: "event1",
          command: "EVENT_IDLE",
        },
      ],
      "script_input_1",
      sb.options,
    );
    expect(symbolA).toEqual("script_input_0");
    expect(symbolB).toEqual("script_input_1");
    expect(
      sb.options.additionalScripts["script_input_0"]?.compiledScript,
    ).toContain("script_input_0::");
    expect(
      sb.options.additionalScripts["script_input_0"]?.compiledScript,
    ).toContain("VM_IDLE");
    expect(
      sb.options.additionalScripts["script_input_1"]?.compiledScript,
    ).toContain("script_input_1::");
    expect(
      sb.options.additionalScripts["script_input_1"]?.compiledScript,
    ).toContain("VM_IDLE");
  });
});

describe("actorMoveRelativeByScriptValues", () => {
  test("should combine all calculations into a single rpn call when determining relative destination", async () => {
    const output: string[] = [];
    const scriptEventHandlers = await getTestScriptHandlers();
    const sb = new ScriptBuilder(output, {
      scriptEventHandlers,
      scene: {
        id: "scene1",
        name: "Scene 1",
        symbol: "scene_1",
        width: 20,
        height: 18,
        background: dummyPrecompiledBackground,
        playerSprite: dummyPrecompiledSpriteSheet,
        sprites: [],
        parallax: [],
        actorsExclusiveLookup: {},
        type: "TOPDOWN",
        actors: [
          { ...dummyActorNormalized, id: "actor1" },
          { ...dummyActorNormalized, id: "actor2" },
        ],
        triggers: [],
        projectiles: [],
      } as unknown as PrecompiledScene,
      entity: {
        id: "actor1",
        name: "Actor 1",
      },
    });
    sb.actorSetActive("player");
    sb.actorMoveRelativeByScriptValues(
      "player",
      {
        type: "add",
        valueA: {
          type: "property",
          target: "actor1",
          property: "xpos",
        },
        valueB: {
          type: "property",
          target: "actor2",
          property: "ypos",
        },
      },
      {
        type: "add",
        valueA: {
          type: "number",
          value: 2,
        },
        valueB: {
          type: "expression",
          value: "$16$ + 5",
        },
      },
      false,
      "horizontal",
      "tiles",
      [],
    );

    expect([
      ...sb.toScriptString("MY_SCRIPT", false).matchAll(/VM_RPN/g),
    ]).toHaveLength(1);
  });

  test("should not perform bit shifts when moving by fixed numbers", async () => {
    const output: string[] = [];
    const scriptEventHandlers = await getTestScriptHandlers();
    const sb = new ScriptBuilder(output, {
      scriptEventHandlers,
      scene: {
        id: "scene1",
        name: "Scene 1",
        symbol: "scene_1",
        width: 20,
        height: 18,
        background: dummyPrecompiledBackground,
        playerSprite: dummyPrecompiledSpriteSheet,
        sprites: [],
        parallax: [],
        actorsExclusiveLookup: {},
        type: "TOPDOWN",
        actors: [
          { ...dummyActorNormalized, id: "actor1" },
          { ...dummyActorNormalized, id: "actor2" },
        ],
        triggers: [],
        projectiles: [],
      } as unknown as PrecompiledScene,
      entity: {
        id: "actor1",
        name: "Actor 1",
      },
    });
    sb.actorSetActive("player");
    sb.actorMoveRelativeByScriptValues(
      "player",
      {
        type: "sub",
        valueA: {
          type: "number",
          value: 10,
        },
        valueB: {
          type: "number",
          value: 10,
        },
      },
      {
        type: "number",
        value: 5,
      },
      false,
      "horizontal",
      "tiles",
      [],
    );

    expect([
      ...sb.toScriptString("MY_SCRIPT", false).matchAll(/\.R_OPERATOR \.SHL/g),
    ]).toHaveLength(0);
    expect([
      ...sb.toScriptString("MY_SCRIPT", false).matchAll(/\.R_OPERATOR \.SHR/g),
    ]).toHaveLength(0);
  });
});

describe("actorMoveToScriptValues", () => {
  test("should combine all calculations into a single rpn call when determining moveTo destination", async () => {
    const output: string[] = [];
    const scriptEventHandlers = await getTestScriptHandlers();
    const sb = new ScriptBuilder(output, {
      scriptEventHandlers,
      scene: {
        id: "scene1",
        name: "Scene 1",
        symbol: "scene_1",
        width: 20,
        height: 18,
        background: dummyPrecompiledBackground,
        playerSprite: dummyPrecompiledSpriteSheet,
        sprites: [],
        parallax: [],
        actorsExclusiveLookup: {},
        type: "TOPDOWN",
        actors: [
          { ...dummyActorNormalized, id: "actor1" },
          { ...dummyActorNormalized, id: "actor2" },
        ],
        triggers: [],
        projectiles: [],
      } as unknown as PrecompiledScene,
      entity: {
        id: "actor1",
        name: "Actor 1",
      },
    });
    sb.actorSetActive("player");
    sb.actorMoveToScriptValues(
      "player",
      {
        type: "add",
        valueA: {
          type: "property",
          target: "actor1",
          property: "xpos",
        },
        valueB: {
          type: "property",
          target: "actor2",
          property: "ypos",
        },
      },
      {
        type: "add",
        valueA: {
          type: "number",
          value: 2,
        },
        valueB: {
          type: "expression",
          value: "$16$ + 5",
        },
      },
      false,
      "horizontal",
      "tiles",
      [],
    );

    expect([
      ...sb.toScriptString("MY_SCRIPT", false).matchAll(/VM_RPN/g),
    ]).toHaveLength(1);
  });

  test("should not perform bit shifts when moving by fixed numbers", async () => {
    const output: string[] = [];
    const scriptEventHandlers = await getTestScriptHandlers();
    const sb = new ScriptBuilder(output, {
      scriptEventHandlers,
      scene: {
        id: "scene1",
        name: "Scene 1",
        symbol: "scene_1",
        width: 20,
        height: 18,
        background: dummyPrecompiledBackground,
        playerSprite: dummyPrecompiledSpriteSheet,
        sprites: [],
        parallax: [],
        actorsExclusiveLookup: {},
        type: "TOPDOWN",
        actors: [
          { ...dummyActorNormalized, id: "actor1" },
          { ...dummyActorNormalized, id: "actor2" },
        ],
        triggers: [],
        projectiles: [],
      } as unknown as PrecompiledScene,
      entity: {
        id: "actor1",
        name: "Actor 1",
      },
    });
    sb.actorSetActive("player");
    sb.actorMoveToScriptValues(
      "player",
      {
        type: "sub",
        valueA: {
          type: "number",
          value: 10,
        },
        valueB: {
          type: "number",
          value: 10,
        },
      },
      {
        type: "number",
        value: 5,
      },
      false,
      "horizontal",
      "tiles",
      [],
    );

    expect([
      ...sb.toScriptString("MY_SCRIPT", false).matchAll(/\.R_OPERATOR \.SHL/g),
    ]).toHaveLength(0);
    expect([
      ...sb.toScriptString("MY_SCRIPT", false).matchAll(/\.R_OPERATOR \.SHR/g),
    ]).toHaveLength(0);
  });

  test("should not perform bit shifts when moving by fixed numbers offset from properties", async () => {
    const output: string[] = [];
    const scriptEventHandlers = await getTestScriptHandlers();
    const sb = new ScriptBuilder(output, {
      scriptEventHandlers,
      scene: {
        id: "scene1",
        name: "Scene 1",
        symbol: "scene_1",
        width: 20,
        height: 18,
        background: dummyPrecompiledBackground,
        playerSprite: dummyPrecompiledSpriteSheet,
        sprites: [],
        parallax: [],
        actorsExclusiveLookup: {},
        type: "TOPDOWN",
        actors: [
          { ...dummyActorNormalized, id: "actor1" },
          { ...dummyActorNormalized, id: "actor2" },
        ],
        triggers: [],
        projectiles: [],
      } as unknown as PrecompiledScene,
      entity: {
        id: "actor1",
        name: "Actor 1",
      },
    });
    sb.actorSetActive("player");
    sb.actorMoveToScriptValues(
      "player",
      {
        type: "add",
        valueA: {
          type: "property",
          target: "player",
          property: "xpos",
        },
        valueB: {
          type: "number",
          value: 10,
        },
      },
      {
        type: "number",
        value: 5,
      },
      false,
      "horizontal",
      "tiles",
      [],
    );

    expect([
      ...sb.toScriptString("MY_SCRIPT", false).matchAll(/\.R_OPERATOR \.SHL/g),
    ]).toHaveLength(0);
    expect([
      ...sb.toScriptString("MY_SCRIPT", false).matchAll(/\.R_OPERATOR \.SHR/g),
    ]).toHaveLength(0);
  });
});

describe("cameraSetBoundsToScriptValues", () => {
  test("should set camera bounds with simple number values", async () => {
    const { sb } = await createTestScriptBuilder();

    sb.cameraSetBoundsToScriptValues(
      { type: "number", value: 2 },
      { type: "number", value: 3 },
      { type: "number", value: 25 },
      { type: "number", value: 20 },
      "tiles",
    );

    const script = sb.toScriptString("MY_SCRIPT", false);
    expect(script).toMatch(
      /\.R_INT16\s+16\s+\.R_REF_MEM_SET \.MEM_I16, _scroll_x_min/,
    );
    expect(script).toMatch(
      /\.R_INT16\s+24\s+\.R_REF_MEM_SET \.MEM_I16, _scroll_y_min/,
    );
    expect(script).toMatch(
      /\.R_INT16\s+56\s+\.R_REF_MEM_SET \.MEM_I16, _scroll_x_max/,
    );
    expect(script).toMatch(
      /\.R_INT16\s+40\s+\.R_REF_MEM_SET \.MEM_I16, _scroll_y_max/,
    );
  });

  test("should set camera bounds with variable values", async () => {
    const { sb } = await createTestScriptBuilder();

    sb.cameraSetBoundsToScriptValues(
      { type: "variable", value: "0" },
      { type: "variable", value: "1" },
      { type: "variable", value: "2" },
      { type: "variable", value: "3" },
      "tiles",
    );

    const script = sb.toScriptString("MY_SCRIPT", false);
    expect(script).toMatch(
      /\.R_REF\s+VAR_VARIABLE_0[\s\S]*?\.R_INT16\s+3[\s\S]*?\.R_OPERATOR\s+\.SHL[\s\S]*?\.R_REF_MEM_SET\s+\.MEM_I16,\s+_scroll_x_min/,
    );
    expect(script).toMatch(
      /\.R_REF\s+VAR_VARIABLE_1[\s\S]*?\.R_INT16\s+3[\s\S]*?\.R_OPERATOR\s+\.SHL[\s\S]*?\.R_REF_MEM_SET\s+\.MEM_I16,\s+_scroll_y_min/,
    );
    expect(script).toMatch(
      /\.R_REF\s+VAR_VARIABLE_2[\s\S]*?\.R_INT16\s+3[\s\S]*?\.R_OPERATOR\s+\.SHL[\s\S]*?\.R_REF_MEM_SET\s+\.MEM_I16,\s+_scroll_x_max/,
    );
    expect(script).toMatch(
      /\.R_REF\s+VAR_VARIABLE_3[\s\S]*?\.R_INT16\s+3[\s\S]*?\.R_OPERATOR\s+\.SHL[\s\S]*?\.R_REF_MEM_SET\s+\.MEM_I16,\s+_scroll_y_max/,
    );
  });

  test("should set camera bounds with pixel units", async () => {
    const { sb } = await createTestScriptBuilder();

    sb.cameraSetBoundsToScriptValues(
      { type: "number", value: 16 },
      { type: "number", value: 24 },
      { type: "number", value: 200 },
      { type: "number", value: 160 },
      "pixels",
    );

    const script = sb.toScriptString("MY_SCRIPT", false);
    expect(script).toMatch(
      /\.R_INT16\s+16\s+\.R_REF_MEM_SET \.MEM_I16, _scroll_x_min/,
    );
    expect(script).toMatch(
      /\.R_INT16\s+24\s+\.R_REF_MEM_SET \.MEM_I16, _scroll_y_min/,
    );
    expect(script).toMatch(
      /\.R_INT16\s+56\s+\.R_REF_MEM_SET \.MEM_I16, _scroll_x_max/,
    );
    expect(script).toMatch(
      /\.R_INT16\s+40\s+\.R_REF_MEM_SET \.MEM_I16, _scroll_y_max/,
    );
  });

  test("should handle complex script values with calculations", async () => {
    const { sb } = await createTestScriptBuilder({
      actors: [{ ...dummyActorNormalized, id: "actor1" }],
    });

    sb.cameraSetBoundsToScriptValues(
      {
        type: "add",
        valueA: { type: "number", value: 2 },
        valueB: { type: "variable", value: "0" },
      },
      {
        type: "sub",
        valueA: { type: "number", value: 10 },
        valueB: { type: "number", value: 3 },
      },
      {
        type: "property",
        target: "actor1",
        property: "xpos",
      },
      { type: "number", value: 20 },
      "tiles",
    );

    const script = sb.toScriptString("MY_SCRIPT", false);
    expect(script).toMatch(/\.R_REF_MEM_SET\s+\.MEM_I16,\s+_scroll_x_min/);
    expect(script).toMatch(/\.R_REF_MEM_SET\s+\.MEM_I16,\s+_scroll_y_min/);
    expect(script).toMatch(/\.R_REF_MEM_SET\s+\.MEM_I16,\s+_scroll_x_max/);
    expect(script).toMatch(/\.R_REF_MEM_SET\s+\.MEM_I16,\s+_scroll_y_max/);
    expect(script).toMatch(
      /\.R_INT16\s+2[\s\S]*?\.R_REF\s+VAR_VARIABLE_0[\s\S]*?\.R_OPERATOR\s+\.ADD/,
    );
    expect(script).toMatch(
      /\.R_INT16\s+56\s+\.R_REF_MEM_SET\s+\.MEM_I16,\s+_scroll_y_min/,
    );
  });

  test("should combine all calculations into a single RPN call", async () => {
    const { sb } = await createTestScriptBuilder({
      actors: [
        { ...dummyActorNormalized, id: "actor1" },
        { ...dummyActorNormalized, id: "actor2" },
      ],
    });

    sb.cameraSetBoundsToScriptValues(
      {
        type: "add",
        valueA: {
          type: "property",
          target: "actor1",
          property: "xpos",
        },
        valueB: {
          type: "property",
          target: "actor2",
          property: "ypos",
        },
      },
      {
        type: "add",
        valueA: { type: "number", value: 2 },
        valueB: { type: "expression", value: "$16$ + 5" },
      },
      { type: "number", value: 30 },
      { type: "number", value: 25 },
      "tiles",
    );

    expect([
      ...sb.toScriptString("MY_SCRIPT", false).matchAll(/VM_RPN/g),
    ]).toHaveLength(1);
  });

  test("should handle default units parameter", async () => {
    const { sb } = await createTestScriptBuilder();

    sb.cameraSetBoundsToScriptValues(
      { type: "number", value: 1 },
      { type: "number", value: 1 },
      { type: "number", value: 20 },
      { type: "number", value: 18 },
    );

    const script = sb.toScriptString("MY_SCRIPT", false);
    expect(script).toMatch(
      /\.R_INT16\s+8\s+\.R_REF_MEM_SET \.MEM_I16, _scroll_x_min/,
    );
    expect(script).toMatch(
      /\.R_INT16\s+8\s+\.R_REF_MEM_SET \.MEM_I16, _scroll_y_min/,
    );
    expect(script).toMatch(
      /\.R_INT16\s+8\s+\.R_REF_MEM_SET \.MEM_I16, _scroll_x_max/,
    );
    expect(script).toMatch(
      /\.R_INT16\s+8\s+\.R_REF_MEM_SET \.MEM_I16, _scroll_y_max/,
    );
  });

  test("should handle zero values", async () => {
    const { sb } = await createTestScriptBuilder();

    sb.cameraSetBoundsToScriptValues(
      { type: "number", value: 0 },
      { type: "number", value: 0 },
      { type: "number", value: 0 },
      { type: "number", value: 0 },
      "tiles",
    );

    const script = sb.toScriptString("MY_SCRIPT", false);
    expect(script).toMatch(
      /\.R_INT16\s+0\s+\.R_REF_MEM_SET \.MEM_I16, _scroll_x_min/,
    );
    expect(script).toMatch(
      /\.R_INT16\s+0\s+\.R_REF_MEM_SET \.MEM_I16, _scroll_y_min/,
    );
    expect(script).toMatch(
      /\.R_INT16\s+0\s+\.R_REF_MEM_SET \.MEM_I16, _scroll_x_max/,
    );
    expect(script).toMatch(
      /\.R_INT16\s+0\s+\.R_REF_MEM_SET \.MEM_I16, _scroll_y_max/,
    );
  });

  test("should handle expression values", async () => {
    const { sb } = await createTestScriptBuilder();

    sb.cameraSetBoundsToScriptValues(
      { type: "expression", value: "$16$ + $17$" },
      { type: "expression", value: "$18$ - 5" },
      { type: "expression", value: "25 * 2" },
      { type: "expression", value: "18 + 2" },
      "tiles",
    );

    const script = sb.toScriptString("MY_SCRIPT", false);
    expect(script).toMatch(/\.R_REF_MEM_SET\s+\.MEM_I16,\s+_scroll_x_min/);
    expect(script).toMatch(/\.R_REF_MEM_SET\s+\.MEM_I16,\s+_scroll_y_min/);
    expect(script).toMatch(/\.R_REF_MEM_SET\s+\.MEM_I16,\s+_scroll_x_max/);
    expect(script).toMatch(/\.R_REF_MEM_SET\s+\.MEM_I16,\s+_scroll_y_max/);
    expect(script).toMatch(/\.R_OPERATOR\s+\.ADD/); // For "$16$ + $17$" and "18 + 2"
    expect(script).toMatch(/\.R_OPERATOR\s+\.SUB/); // For "$18$ - 5"
    expect(script).toContain(".R_INT16    400"); // Pre-calculated result of 25 * 2
    expect(script).toContain("VAR_VARIABLE_16"); // From "$16$"
    expect(script).toContain("VAR_VARIABLE_17"); // From "$17$"
    expect(script).toContain("VAR_VARIABLE_18"); // From "$18$"
  });
});

describe("ScriptValue to RPN", () => {
  const extractRPN = (script: string): string[] => {
    return script
      .replace(/[\S\s]*VM_RPN\n([\S\s]*)\n.*.R_STOP[\S\s]*/g, "$1")
      .split("\n")
      .map((l) => l.trim());
  };
  test("Should convert number values to RPN calls", async () => {
    const { sb } = await createTestScriptBuilder();
    const scriptValue = {
      type: "number",
      value: 42,
    } as const;
    const [rpnOps, fetchOps] = precompileScriptValue(scriptValue);
    const rpn = sb._rpn();
    const localsLookup = sb._performFetchOperations(fetchOps);
    sb._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.stop();
    sb._stackPop(1);
    const script = sb.toScriptString("MY_SCRIPT", false);
    expect(extractRPN(script)).toMatchObject([".R_INT16    42"]);
    expect(fetchOps).toBeEmpty();
  });

  test("Should convert variables to RPN calls", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        variablesLookup: {
          "0": {
            id: "0",
            name: "My Var",
            symbol: "var_myvar",
            type: "number",
          },
        },
      },
    );
    const scriptValue = {
      type: "variable",
      value: "0",
    } as const;
    const [rpnOps, fetchOps] = precompileScriptValue(scriptValue);
    const rpn = sb._rpn();
    const localsLookup = sb._performFetchOperations(fetchOps);
    sb._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.stop();
    sb._stackPop(1);
    const script = sb.toScriptString("MY_SCRIPT", false);
    expect(extractRPN(script)).toMatchObject([".R_REF      VAR_MYVAR"]);
    expect(fetchOps).toBeEmpty();
  });

  test("Should convert math operations to RPN calls", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        variablesLookup: {
          "0": {
            id: "0",
            name: "My Var",
            symbol: "var_myvar",
            type: "number",
          },
        },
      },
    );
    const scriptValue = {
      type: "add",
      valueA: {
        type: "number",
        value: 42,
      },
      valueB: {
        type: "variable",
        value: "0",
      },
    } as const;
    const [rpnOps, fetchOps] = precompileScriptValue(scriptValue);
    const rpn = sb._rpn();
    const localsLookup = sb._performFetchOperations(fetchOps);
    sb._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.stop();
    sb._stackPop(1);
    const script = sb.toScriptString("MY_SCRIPT", false);
    expect(extractRPN(script)).toMatchObject([
      ".R_INT16    42",
      ".R_REF      VAR_MYVAR",
      ".R_OPERATOR .ADD",
    ]);
    expect(fetchOps).toBeEmpty();
  });

  test("Should fetch player x position", async () => {
    const { sb } = await createTestScriptBuilder();
    const scriptValue = {
      type: "property",
      target: "player",
      property: "xpos",
    } as const;
    const [rpnOps, fetchOps] = precompileScriptValue(scriptValue);
    const rpn = sb._rpn();
    const localsLookup = sb._performFetchOperations(fetchOps);
    sb._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.stop();
    sb._stackPop(1);
    const script = sb.toScriptString("MY_SCRIPT", false);
    expect(script).toMatch(/VM_ACTOR_GET_POS {8}.LOCAL_TMP0_ACTOR_POS/);
    expect(extractRPN(script)).toMatchObject([
      ".R_REF      ^/(.LOCAL_TMP0_ACTOR_POS + 1)/",
      ".R_INT16    8",
      ".R_OPERATOR .SHR",
    ]);
    expect(fetchOps).toHaveLength(1);
  });

  test("Should fetch actor y position", async () => {
    const { sb } = await createTestScriptBuilder({
      actors: [{ ...dummyActorNormalized, id: "actor1" }],
    });
    const scriptValue = {
      type: "property",
      target: "actor1",
      property: "ypos",
    } as const;
    const [rpnOps, fetchOps] = precompileScriptValue(scriptValue);
    const rpn = sb._rpn();
    const localsLookup = sb._performFetchOperations(fetchOps);
    sb._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.stop();
    sb._stackPop(1);
    const script = sb.toScriptString("MY_SCRIPT", false);
    expect(script).toMatch(/VM_SET_CONST {12}.LOCAL_TMP0_ACTOR_POS, 1/);
    expect(script).toMatch(/VM_ACTOR_GET_POS {8}.LOCAL_TMP0_ACTOR_POS/);
    expect(extractRPN(script)).toMatchObject([
      ".R_REF      ^/(.LOCAL_TMP0_ACTOR_POS + 2)/",
      ".R_INT16    8",
      ".R_OPERATOR .SHR",
    ]);
    expect(fetchOps).toHaveLength(1);
  });

  test("Should fetch WORD engine field", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        engineFields: {
          myfield: {
            ...dummyEngineFieldSchema,
            key: "myfield",
            cType: "WORD",
          },
        },
      },
    );
    const scriptValue = {
      type: "engineField",
      value: "myfield",
    } as const;
    const [rpnOps, fetchOps] = precompileScriptValue(scriptValue);
    const rpn = sb._rpn();
    const localsLookup = sb._performFetchOperations(fetchOps);
    sb._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.stop();
    sb._stackPop(1);
    const script = sb.toScriptString("MY_SCRIPT", false);
    expect(extractRPN(script)).toMatchObject([
      ".R_REF_MEM  .MEM_I16, _myfield",
    ]);
    expect(fetchOps).toHaveLength(1);
  });

  test("Should fetch BYTE/UBYTE engine field", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        engineFields: {
          myfieldu8: {
            ...dummyEngineFieldSchema,
            key: "myfieldu8",
            cType: "UBYTE",
          },
          myfieldi8: {
            ...dummyEngineFieldSchema,
            key: "myfieldi8",
            cType: "BYTE",
          },
        },
      },
    );
    const scriptValue = {
      type: "add",
      valueA: {
        type: "engineField",
        value: "myfieldu8",
      },
      valueB: {
        type: "engineField",
        value: "myfieldi8",
      },
    } as const;
    const [rpnOps, fetchOps] = precompileScriptValue(scriptValue);
    const rpn = sb._rpn();
    const localsLookup = sb._performFetchOperations(fetchOps);
    sb._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.stop();
    sb._stackPop(1);
    const script = sb.toScriptString("MY_SCRIPT", false);
    expect(extractRPN(script)).toMatchObject([
      ".R_REF_MEM  .MEM_U8, _myfieldu8",
      ".R_REF_MEM  .MEM_I8, _myfieldi8",
      ".R_OPERATOR .ADD",
    ]);
    expect(fetchOps).toHaveLength(2);
  });

  test("Should fallback to 0 for missing engine field", async () => {
    const { sb } = await createTestScriptBuilder();
    const scriptValue = {
      type: "engineField",
      value: "missingfield",
    } as const;
    const [rpnOps, fetchOps] = precompileScriptValue(scriptValue);
    const rpn = sb._rpn();
    const localsLookup = sb._performFetchOperations(fetchOps);
    sb._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.stop();
    sb._stackPop(1);
    const script = sb.toScriptString("MY_SCRIPT", false);
    expect(extractRPN(script)).toMatchObject([".R_INT16    0"]);
    expect(fetchOps).toHaveLength(1);
  });

  test("Should convert engine constants to RPN with symbol name", async () => {
    const { sb } = await createTestScriptBuilder();
    const scriptValue = {
      type: "constant",
      value: "engine::MAX_HEALTH",
    } as const;
    const [rpnOps, fetchOps] = precompileScriptValue(scriptValue);
    const rpn = sb._rpn();
    const localsLookup = sb._performFetchOperations(fetchOps);
    sb._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.stop();
    sb._stackPop(1);
    const script = sb.toScriptString("MY_SCRIPT", false);
    expect(extractRPN(script)).toMatchObject([".R_INT16    MAX_HEALTH"]);
  });

  test("Should convert expressions with engine constants and variables", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        variablesLookup: {
          "0": {
            id: "0",
            name: "Health",
            symbol: "var_variable_0",
            type: "number",
          },
        },
      },
    );
    const scriptValue = {
      type: "add",
      valueA: {
        type: "variable",
        value: "0",
      },
      valueB: {
        type: "constant",
        value: "engine::BONUS_HEALTH",
      },
    } as const;
    const [rpnOps, fetchOps] = precompileScriptValue(scriptValue);
    const rpn = sb._rpn();
    const localsLookup = sb._performFetchOperations(fetchOps);
    sb._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.stop();
    sb._stackPop(1);
    const script = sb.toScriptString("MY_SCRIPT", false);
    expect(extractRPN(script)).toContain(".R_REF      VAR_VARIABLE_0");
    expect(extractRPN(script)).toContain(".R_INT16    BONUS_HEALTH");
  });

  test("Should handle getConstantSymbol with engine constants", async () => {
    const { sb } = await createTestScriptBuilder();
    const symbol = sb.getConstantSymbol("engine::MAX_HEALTH");
    expect(symbol).toBe("MAX_HEALTH");
  });

  test("Should handle getConstantSymbol with engine constants containing underscores and numbers", async () => {
    const { sb } = await createTestScriptBuilder();
    expect(sb.getConstantSymbol("engine::PLAYER_MAX_SPEED")).toBe(
      "PLAYER_MAX_SPEED",
    );
    expect(sb.getConstantSymbol("engine::LEVEL_1_MAX")).toBe("LEVEL_1_MAX");
  });

  test("Should handle getConstantSymbol with user constants", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        constantsLookup: {
          "550e8400-e29b-41d4-a716-446655440000": {
            id: "550e8400-e29b-41d4-a716-446655440000",
            name: "MY_CONSTANT",
            symbol: "const_my_constant",
            value: 100,
          },
        },
      },
    );
    const symbol = sb.getConstantSymbol("550e8400-e29b-41d4-a716-446655440000");
    expect(symbol).toBe("CONST_MY_CONSTANT");
  });

  test("Should convert args to RPN calls", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        argLookup: {
          variable: new Map([
            [
              "V0",
              {
                type: "argument",
                indirect: false,
                symbol: ".SCRIPT_ARG_0_VARIABLE",
              },
            ],
          ]),
          actor: new Map(),
        },
      },
    );
    const scriptValue = {
      type: "variable",
      value: "V0",
    } as const;
    const [rpnOps, fetchOps] = precompileScriptValue(scriptValue);
    const rpn = sb._rpn();
    const localsLookup = sb._performFetchOperations(fetchOps);
    sb._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.stop();
    sb._stackPop(1);
    const script = sb.toScriptString("MY_SCRIPT", false);
    expect(extractRPN(script)).toMatchObject([
      ".R_REF      .SCRIPT_ARG_0_VARIABLE",
    ]);
    expect(fetchOps).toBeEmpty();
  });

  test("Should convert indirect args to RPN calls", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        argLookup: {
          variable: new Map([
            [
              "V0",
              {
                type: "argument",
                indirect: true,
                symbol: ".SCRIPT_ARG_0_VARIABLE",
              },
            ],
          ]),
          actor: new Map(),
        },
      },
    );
    const scriptValue = {
      type: "variable",
      value: "V0",
    } as const;
    const [rpnOps, fetchOps] = precompileScriptValue(scriptValue);
    const rpn = sb._rpn();
    const localsLookup = sb._performFetchOperations(fetchOps);
    sb._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.stop();
    sb._stackPop(1);
    const script = sb.toScriptString("MY_SCRIPT", false);
    expect(extractRPN(script)).toMatchObject([
      ".R_REF_IND  .SCRIPT_ARG_0_VARIABLE",
    ]);
    expect(fetchOps).toBeEmpty();
  });

  test("Should convert expressions containing both direct and indirect args to RPN calls", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        argLookup: {
          variable: new Map([
            [
              "V0",
              {
                type: "argument",
                indirect: false,
                symbol: ".SCRIPT_ARG_0_VARIABLE",
              },
            ],
            [
              "V1",
              {
                type: "argument",
                indirect: true,
                symbol: ".SCRIPT_ARG_1_VARIABLE",
              },
            ],
          ]),
          actor: new Map(),
        },
      },
    );
    const scriptValue = {
      type: "expression",
      value: "$V0$ + $V1$",
    } as const;
    const [rpnOps, fetchOps] = precompileScriptValue(scriptValue);
    const rpn = sb._rpn();
    const localsLookup = sb._performFetchOperations(fetchOps);
    sb._performValueRPN(rpn, rpnOps, localsLookup);
    rpn.stop();
    sb._stackPop(1);
    const script = sb.toScriptString("MY_SCRIPT", false);
    expect(extractRPN(script)).toMatchObject([
      ".R_REF      .SCRIPT_ARG_0_VARIABLE",
      ".R_REF_IND  .SCRIPT_ARG_1_VARIABLE",
      ".R_OPERATOR .ADD",
    ]);
    expect(fetchOps).toBeEmpty();
  });
});

describe("Dialogue", () => {
  test("Should be able to open dialogue boxes", async () => {
    const dummyCompiledFont = await getDummyCompiledFont();
    const { sb } = await createTestScriptBuilder(
      {},
      {
        fonts: [dummyCompiledFont],
      },
    );
    sb.textDialogue("Hello World");
    sb.scriptEnd();

    expect(sb.toScriptString("MY_SCRIPT", false)).toEqual(
      `.module MY_SCRIPT

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255


___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

_MY_SCRIPT::
        ; Text Dialogue
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_SPEED_INSTANT
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_OVERLAY_SET_SCROLL   1, 1, 18, 5, .UI_COLOR_WHITE
        VM_SWITCH_TEXT_LAYER    .TEXT_LAYER_WIN
        VM_LOAD_TEXT            0
        .asciz "Hello World"
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        ; Stop Script
        VM_STOP
`,
    );
  });

  test("Should be able to open dialogue boxes with variables", async () => {
    const dummyCompiledFont = await getDummyCompiledFont();
    const { sb } = await createTestScriptBuilder(
      {},
      {
        fonts: [dummyCompiledFont],
      },
    );
    sb.textDialogue("Hello World $42$");
    sb.scriptEnd();

    expect(sb.toScriptString("MY_SCRIPT", false)).toEqual(
      `.module MY_SCRIPT

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255


___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

_MY_SCRIPT::
        ; Text Dialogue
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_SPEED_INSTANT
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_OVERLAY_SET_SCROLL   1, 1, 18, 5, .UI_COLOR_WHITE
        VM_SWITCH_TEXT_LAYER    .TEXT_LAYER_WIN
        VM_LOAD_TEXT            1
        .dw VAR_VARIABLE_42
        .asciz "Hello World %d"
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        ; Stop Script
        VM_STOP
`,
    );
  });

  test("Should replace missing dialogue variables with zero", async () => {
    const dummyCompiledFont = await getDummyCompiledFont();
    const { sb } = await createTestScriptBuilder(
      {},
      {
        fonts: [dummyCompiledFont],
      },
    );
    const missingVariableId = "abcdef01-2345-6789-abcd-ef0123456789";

    sb.textDialogue(`Missing $${missingVariableId}$`);

    const script = sb.toScriptString("MY_SCRIPT", false);
    expect(script).toContain("VM_SET_CONST");
    expect(script).toContain("MISSING_VARIABLE, 0");
    expect(script).toContain('.asciz "Missing %d"');
    expect(script).not.toContain(missingVariableId);
  });

  test("Should be able to open dialogue boxes with direct args", async () => {
    const dummyCompiledFont = await getDummyCompiledFont();
    const { sb } = await createTestScriptBuilder(
      {},
      {
        fonts: [dummyCompiledFont],
        argLookup: {
          variable: new Map([
            [
              "V0",
              {
                type: "argument",
                indirect: false,
                symbol: ".SCRIPT_ARG_0_VARIABLE",
              },
            ],
          ]),
          actor: new Map(),
        },
      },
    );
    sb.textDialogue("Hello World $V0$");
    sb.scriptEnd();

    expect(sb.toScriptString("MY_SCRIPT", false)).toEqual(
      `.module MY_SCRIPT

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255

.SCRIPT_ARG_0_VARIABLE = -3

___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

_MY_SCRIPT::
        ; Text Dialogue
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_SPEED_INSTANT
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_OVERLAY_SET_SCROLL   1, 1, 18, 5, .UI_COLOR_WHITE
        VM_SWITCH_TEXT_LAYER    .TEXT_LAYER_WIN
        VM_LOAD_TEXT            1
        .dw .SCRIPT_ARG_0_VARIABLE
        .asciz "Hello World %d"
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        ; Stop Script
        VM_STOP
`,
    );
  });

  test("Should be able to open dialogue boxes with indirect args", async () => {
    const dummyCompiledFont = await getDummyCompiledFont();
    const { sb } = await createTestScriptBuilder(
      {},
      {
        fonts: [dummyCompiledFont],
        argLookup: {
          variable: new Map([
            [
              "V0",
              {
                type: "argument",
                indirect: true,
                symbol: ".SCRIPT_ARG_0_VARIABLE",
              },
            ],
          ]),
          actor: new Map(),
        },
      },
    );
    sb.textDialogue("Hello World $V0$");
    sb.scriptEnd();

    expect(sb.toScriptString("MY_SCRIPT", false)).toEqual(
      `.module MY_SCRIPT

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255

.SCRIPT_ARG_0_VARIABLE = -3
.LOCAL_TMP0_TEXT_ARG0 = -0

___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

_MY_SCRIPT::
        ; Text Dialogue
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_SPEED_INSTANT
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_OVERLAY_SET_SCROLL   1, 1, 18, 5, .UI_COLOR_WHITE
        VM_SWITCH_TEXT_LAYER    .TEXT_LAYER_WIN
        VM_GET_INDIRECT         .LOCAL_TMP0_TEXT_ARG0, .SCRIPT_ARG_0_VARIABLE
        VM_LOAD_TEXT            1
        .dw .LOCAL_TMP0_TEXT_ARG0
        .asciz "Hello World %d"
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        ; Stop Script
        VM_STOP
`,
    );
  });

  test("Should be able to open dialogue boxes with both direct and indirect args", async () => {
    const dummyCompiledFont = await getDummyCompiledFont();
    const { sb } = await createTestScriptBuilder(
      {},
      {
        fonts: [dummyCompiledFont],
        argLookup: {
          variable: new Map([
            [
              "V0",
              {
                type: "argument",
                indirect: false,
                symbol: ".SCRIPT_ARG_0_VARIABLE",
              },
            ],
            [
              "V1",
              {
                type: "argument",
                indirect: true,
                symbol: ".SCRIPT_ARG_1_VARIABLE",
              },
            ],
          ]),
          actor: new Map(),
        },
      },
    );
    sb.textDialogue("Hello World $V0$ $V1$");
    sb.scriptEnd();

    expect(sb.toScriptString("MY_SCRIPT", false)).toEqual(
      `.module MY_SCRIPT

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255

.SCRIPT_ARG_1_VARIABLE = -3
.SCRIPT_ARG_0_VARIABLE = -4
.LOCAL_TMP0_TEXT_ARG0 = -0

___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

_MY_SCRIPT::
        ; Text Dialogue
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_SPEED_INSTANT
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_OVERLAY_SET_SCROLL   1, 1, 18, 5, .UI_COLOR_WHITE
        VM_SWITCH_TEXT_LAYER    .TEXT_LAYER_WIN
        VM_GET_INDIRECT         .LOCAL_TMP0_TEXT_ARG0, .SCRIPT_ARG_1_VARIABLE
        VM_LOAD_TEXT            2
        .dw .SCRIPT_ARG_0_VARIABLE, .LOCAL_TMP0_TEXT_ARG0
        .asciz "Hello World %d %d"
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        ; Stop Script
        VM_STOP
`,
    );
  });
});

describe("getVariableAlias", () => {
  test("Should return variable symbol if it exists", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        variablesLookup: {
          "0": {
            id: "0",
            name: "My Var",
            symbol: "var_myvar",
            type: "number",
          },
        },
      },
    );
    expect(sb.getVariableAlias("0")).toBe("VAR_MYVAR");
  });

  test("Should return direct arg symbol", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        argLookup: {
          variable: new Map([
            [
              "V0",
              {
                type: "argument",
                indirect: false,
                symbol: ".SCRIPT_ARG_0_VARIABLE",
              },
            ],
          ]),
          actor: new Map(),
        },
      },
    );
    expect(sb.getVariableAlias("V0")).toBe(".SCRIPT_ARG_0_VARIABLE");
  });

  test("Should return indirect arg symbol", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        argLookup: {
          variable: new Map([
            [
              "V0",
              {
                type: "argument",
                indirect: true,
                symbol: ".SCRIPT_ARG_0_VARIABLE",
              },
            ],
          ]),
          actor: new Map(),
        },
      },
    );
    expect(sb.getVariableAlias("V0")).toBe(".SCRIPT_ARG_0_VARIABLE");
  });
});

describe("compileCustomEventScript", () => {
  test("Should compile a custom event script with no args", async () => {
    const dummyCompiledFont = await getDummyCompiledFont();
    const { sb } = await createTestScriptBuilder(
      {},
      {
        customEvents: [
          {
            id: "script1",
            name: "Hello World Script",
            description: "",
            variables: {},
            actors: {},
            symbol: "script1",
            script: [
              {
                command: "EVENT_TEXT",
                args: {
                  text: ["Hello World"],
                },
                id: "event1",
              },
            ],
          },
        ],
        fonts: [dummyCompiledFont],
      },
    );

    const script = sb.compileCustomEventScript("script1");
    expect(script).toEqual({ argsLen: 0, scriptRef: "script1" });
    expect(sb.options.additionalScripts["script1"]?.compiledScript)
      .toEqual(`.module script1

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255


___bank_script1 = 255
.globl ___bank_script1

_script1::
        ; Text Dialogue
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_SPEED_INSTANT
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_OVERLAY_SET_SCROLL   1, 1, 18, 5, .UI_COLOR_WHITE
        VM_SWITCH_TEXT_LAYER    .TEXT_LAYER_WIN
        VM_LOAD_TEXT            0
        .asciz "Hello World"
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        VM_RET_FAR
`);
  });

  test("Should compile a custom event script with indirect variable arg", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        customEvents: [
          {
            id: "script1",
            name: "Test Script",
            description: "",
            variables: {
              V0: {
                id: "V0",
                name: "Variable A",
                passByReference: true,
              },
            },
            actors: {},
            symbol: "script1",
            script: [
              {
                command: "EVENT_INC_VALUE",
                args: {
                  variable: "V0",
                },
                id: "event1",
              },
            ],
          },
        ],
      },
    );

    const script = sb.compileCustomEventScript("script1");
    expect(script).toEqual({ argsLen: 1, scriptRef: "script1" });
    expect(sb.options.additionalScripts["script1"]?.compiledScript)
      .toEqual(`.module script1

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255

.SCRIPT_ARG_INDIRECT_0_VARIABLE = -3

___bank_script1 = 255
.globl ___bank_script1

_script1::
        ; Variable Increment By 1
        VM_RPN
            .R_REF_IND  .SCRIPT_ARG_INDIRECT_0_VARIABLE
            .R_INT8     1
            .R_OPERATOR .ADD
            .R_REF_SET_IND .SCRIPT_ARG_INDIRECT_0_VARIABLE
            .R_STOP

        VM_RET_FAR_N            1
`);
  });

  test("Should compile a custom event script with direct variable arg", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        customEvents: [
          {
            id: "script1",
            name: "Test Script",
            description: "",
            variables: {
              V0: {
                id: "V0",
                name: "Variable A",
                passByReference: false,
              },
            },
            actors: {},
            symbol: "script1",
            script: [
              {
                command: "EVENT_INC_VALUE",
                args: {
                  variable: "V0",
                },
                id: "event1",
              },
            ],
          },
        ],
      },
    );

    const script = sb.compileCustomEventScript("script1");
    expect(script).toEqual({ argsLen: 1, scriptRef: "script1" });
    expect(sb.options.additionalScripts["script1"]?.compiledScript)
      .toEqual(`.module script1

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255

.SCRIPT_ARG_0_VARIABLE = -3

___bank_script1 = 255
.globl ___bank_script1

_script1::
        ; Variable Increment By 1
        VM_RPN
            .R_REF      .SCRIPT_ARG_0_VARIABLE
            .R_INT8     1
            .R_OPERATOR .ADD
            .R_REF_SET  .SCRIPT_ARG_0_VARIABLE
            .R_STOP

        VM_RET_FAR_N            1
`);
  });

  test("Should compile indexed access for an array reference arg", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        customEvents: [
          {
            id: "script1",
            name: "Test Script",
            description: "",
            variables: {
              V0: {
                id: "V0",
                name: "Array",
                passByReference: "array",
                length: 2,
              },
              V1: {
                id: "V1",
                name: "Output",
                passByReference: true,
              },
            },
            actors: {},
            symbol: "script1",
            script: [
              {
                command: "EVENT_SET_VALUE",
                args: {
                  variable: "V1",
                  value: {
                    type: "expression",
                    value: "$V0$[3]",
                  },
                },
                id: "event1",
              },
            ],
          },
        ],
      },
    );

    sb.compileCustomEventScript("script1");
    const script = sb.options.additionalScripts["script1"]?.compiledScript;
    expect(script).toContain(".R_REF      .SCRIPT_ARG_INDIRECT_0_VARIABLE");
    expect(script).toContain(".R_INT16    3");
    expect(script).toContain(".R_REF_SET  .LOCAL_TMP0_ARRAY_PTR");
    expect(script).toContain(
      "VM_SET_INDIRECT         ^/(.SCRIPT_ARG_INDIRECT_1_VARIABLE - 1)/, .ARG0",
    );
  });

  test("Should compile a missing array-reference index as index zero", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        customEvents: [
          {
            id: "script1",
            name: "Test Script",
            description: "",
            variables: {
              V0: {
                id: "V0",
                name: "Array",
                passByReference: "array",
                length: 2,
              },
              V1: {
                id: "V1",
                name: "Output",
                passByReference: true,
              },
            },
            actors: {},
            symbol: "script1",
            script: [
              {
                command: "EVENT_SET_VALUE",
                args: {
                  variable: "V1",
                  value: {
                    type: "variable",
                    value: "V0",
                  },
                },
                id: "event1",
              },
            ],
          },
        ],
      },
    );

    sb.compileCustomEventScript("script1");
    const script = sb.options.additionalScripts["script1"]?.compiledScript;
    expect(script).toContain(
      "VM_PUSH_VALUE_IND       .SCRIPT_ARG_INDIRECT_0_VARIABLE",
    );
    expect(script).not.toContain("ARRAY_PTR");
  });

  test("Should compile a custom event script with actor arg", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        customEvents: [
          {
            id: "script1",
            name: "Test Script",
            description: "",
            variables: {},
            actors: {
              "0": {
                id: "0",
                name: "Actor A",
              },
            },
            symbol: "script1",
            script: [
              {
                command: "EVENT_ACTOR_SET_DIRECTION",
                args: {
                  actorId: "0",
                  direction: {
                    type: "direction",
                    value: "right",
                  },
                },
                id: "event1",
              },
            ],
          },
        ],
      },
    );

    const script = sb.compileCustomEventScript("script1");
    expect(script).toEqual({ argsLen: 1, scriptRef: "script1" });

    expect(sb.options.additionalScripts["script1"]?.compiledScript)
      .toEqual(`.module script1

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255

.SCRIPT_ARG_0_ACTOR = -7
.LOCAL_ACTOR = -4

___bank_script1 = 255
.globl ___bank_script1

_script1::
        VM_RESERVE              4

        ; Actor Set Direction To
        VM_SET                  .LOCAL_ACTOR, .SCRIPT_ARG_0_ACTOR
        VM_ACTOR_SET_DIR        .LOCAL_ACTOR, .DIR_RIGHT

        VM_RESERVE              -4
        VM_RET_FAR_N            1
`);
  });

  test("Should compile a custom event script with actor arg in script value", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        customEvents: [
          {
            id: "script1",
            name: "Test Script",
            description: "",
            variables: {
              V0: {
                id: "V0",
                name: "Variable A",
                passByReference: true,
              },
            },
            actors: {
              "0": {
                id: "0",
                name: "Actor A",
              },
            },
            symbol: "script1",
            script: [
              {
                command: "EVENT_SET_VALUE",
                args: {
                  variable: "V0",
                  value: {
                    type: "property",
                    target: "0",
                    property: "xpos",
                  },
                },
                id: "event1",
              },
            ],
          },
        ],
      },
    );

    const script = sb.compileCustomEventScript("script1");
    expect(script).toEqual({ argsLen: 2, scriptRef: "script1" });

    expect(sb.options.additionalScripts["script1"]?.compiledScript)
      .toEqual(`.module script1

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255

.SCRIPT_ARG_INDIRECT_0_VARIABLE = -7
.SCRIPT_ARG_1_ACTOR = -8
.LOCAL_TMP0_ACTOR_POS = -4

___bank_script1 = 255
.globl ___bank_script1

_script1::
        VM_RESERVE              4

        ; Variable Set To
        ; -- Fetch .SCRIPT_ARG_1_ACTOR actorPosition
        VM_SET                  .LOCAL_TMP0_ACTOR_POS, .SCRIPT_ARG_1_ACTOR
        VM_ACTOR_GET_POS        .LOCAL_TMP0_ACTOR_POS
        ; -- Calculate value
        VM_RPN
            .R_REF      ^/(.LOCAL_TMP0_ACTOR_POS + 1)/
            .R_INT16    8
            .R_OPERATOR .SHR
            .R_REF_SET_IND .SCRIPT_ARG_INDIRECT_0_VARIABLE
            .R_STOP

        VM_RESERVE              -4
        VM_RET_FAR_N            2
`);
  });

  test("Should resolve an actor arg used inside an array index", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        variablesLookup: {
          "11111111-1111-1111-1111-111111111111": {
            id: "11111111-1111-1111-1111-111111111111",
            name: "Results",
            symbol: "var_results",
            type: "array",
            length: 20,
          },
        },
        customEvents: [
          {
            id: "script1",
            name: "Test Script",
            description: "",
            variables: {},
            actors: {
              "0": {
                id: "0",
                name: "Target",
              },
            },
            symbol: "script1",
            script: [
              {
                command: "EVENT_SET_VALUE",
                args: {
                  variable: {
                    type: "variable",
                    value: "11111111-1111-1111-1111-111111111111",
                    index: {
                      type: "property",
                      target: "0",
                      property: "xpos",
                    },
                  },
                  value: {
                    type: "number",
                    value: 99,
                  },
                },
                id: "event1",
              },
            ],
          },
        ],
      },
    );

    sb.compileCustomEventScript("script1");
    const script = sb.options.additionalScripts["script1"]?.compiledScript;

    expect(script).toContain("-- Fetch .SCRIPT_ARG_0_ACTOR actorPosition");
    expect(script).toContain(
      "VM_SET_CONST            .LOCAL_TMP2_VALUE_TMP, 99",
    );
    expect(script).toContain(
      "VM_SET_INDIRECT         .LOCAL_TMP0_ARRAY_PTR, .LOCAL_TMP2_VALUE_TMP",
    );
    expect(script).not.toContain("-- Fetch 0 actorPosition");
  });

  test("Should compile a custom event script with camera property in script value", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        customEvents: [
          {
            id: "script1",
            name: "Test Script",
            description: "",
            variables: {
              V0: {
                id: "V0",
                name: "Variable A",
                passByReference: true,
              },
            },
            actors: {},
            symbol: "script1",
            script: [
              {
                command: "EVENT_SET_VALUE",
                args: {
                  variable: "V0",
                  value: {
                    type: "property",
                    target: "camera",
                    property: "xpos",
                  },
                },
                id: "event1",
              },
            ],
          },
        ],
      },
    );

    const script = sb.compileCustomEventScript("script1");
    expect(script).toEqual({ argsLen: 1, scriptRef: "script1" });

    expect(sb.options.additionalScripts["script1"]?.compiledScript)
      .toEqual(`.module script1

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255

.SCRIPT_ARG_INDIRECT_0_VARIABLE = -3

___bank_script1 = 255
.globl ___bank_script1

_script1::
        ; Variable Set To
        ; -- Calculate value
        VM_RPN
            .R_REF_MEM  .MEM_I16, _camera_x
            .R_INT16    8
            .R_OPERATOR .SHR
            .R_REF_SET_IND .SCRIPT_ARG_INDIRECT_0_VARIABLE
            .R_STOP

        VM_RET_FAR_N            1
`);
  });
});

describe("arraySetToScriptValues", () => {
  test("should set array to constant values", async () => {
    const arrayId = "11111111-1111-1111-1111-111111111111";

    const { sb, output } = await createTestScriptBuilder(
      {},
      {
        variablesLookup: {
          [arrayId]: {
            id: arrayId,
            name: "Array",
            symbol: "var_array",
            type: "array",
            length: 3,
          },
        },
      },
    );

    sb.arraySetToScriptValues(arrayId, [
      { type: "number", value: 10 },
      { type: "number", value: 11 },
      { type: "number", value: 12 },
    ]);

    expect(output).toEqual([
      "        ; Array Set",
      "        VM_RPN",
      "            .R_INT16    10",
      "            .R_REF_SET  ^/(VAR_ARRAY + 0)/",
      "            .R_INT16    11",
      "            .R_REF_SET  ^/(VAR_ARRAY + 1)/",
      "            .R_INT16    12",
      "            .R_REF_SET  ^/(VAR_ARRAY + 2)/",
      "            .R_STOP",
      "",
    ]);
  });

  test("should zero out array for missing values", async () => {
    const arrayId = "11111111-1111-1111-1111-111111111111";

    const { sb, output } = await createTestScriptBuilder(
      {},
      {
        variablesLookup: {
          [arrayId]: {
            id: arrayId,
            name: "Array",
            symbol: "var_array",
            type: "array",
            length: 3,
          },
        },
      },
    );

    sb.arraySetToScriptValues(arrayId, [{ type: "number", value: 42 }]);

    expect(output).toEqual([
      "        ; Array Set",
      "        VM_RPN",
      "            .R_INT16    42",
      "            .R_REF_SET  ^/(VAR_ARRAY + 0)/",
      "            .R_INT16    0",
      "            .R_REF_SET  ^/(VAR_ARRAY + 1)/",
      "            .R_INT16    0",
      "            .R_REF_SET  ^/(VAR_ARRAY + 2)/",
      "            .R_STOP",
      "",
    ]);
  });
});

describe("arraySetToScriptValues", () => {
  const arrayId = "11111111-1111-1111-1111-111111111111";
  const sourceId = "22222222-2222-2222-2222-222222222222";

  const arrayVariable = (length: number) => ({
    id: arrayId,
    name: "Array",
    symbol: "var_array",
    type: "array" as const,
    length,
  });

  const indirectArrayArg = (
    symbol = ".SCRIPT_ARG_INDIRECT_0_VARIABLE",
    length: number,
  ) => ({
    type: "argument" as const,
    indirect: true,
    array: true,
    length,
    symbol,
  });

  test("should set array to constant values", async () => {
    const { sb, output } = await createTestScriptBuilder(
      {},
      {
        variablesLookup: {
          [arrayId]: arrayVariable(3),
        },
      },
    );

    sb.arraySetToScriptValues(arrayId, [
      { type: "number", value: 10 },
      { type: "number", value: 11 },
      { type: "number", value: 12 },
    ]);

    expect(output).toEqual([
      "        ; Array Set",
      "        VM_RPN",
      "            .R_INT16    10",
      "            .R_REF_SET  ^/(VAR_ARRAY + 0)/",
      "            .R_INT16    11",
      "            .R_REF_SET  ^/(VAR_ARRAY + 1)/",
      "            .R_INT16    12",
      "            .R_REF_SET  ^/(VAR_ARRAY + 2)/",
      "            .R_STOP",
      "",
    ]);
  });

  test("should zero out array for missing values", async () => {
    const { sb, output } = await createTestScriptBuilder(
      {},
      {
        variablesLookup: {
          [arrayId]: arrayVariable(3),
        },
      },
    );

    sb.arraySetToScriptValues(arrayId, [{ type: "number", value: 42 }]);

    expect(output).toEqual([
      "        ; Array Set",
      "        VM_RPN",
      "            .R_INT16    42",
      "            .R_REF_SET  ^/(VAR_ARRAY + 0)/",
      "            .R_INT16    0",
      "            .R_REF_SET  ^/(VAR_ARRAY + 1)/",
      "            .R_INT16    0",
      "            .R_REF_SET  ^/(VAR_ARRAY + 2)/",
      "            .R_STOP",
      "",
    ]);
  });

  test("should zero out entire array when given no values", async () => {
    const { sb, output } = await createTestScriptBuilder(
      {},
      {
        variablesLookup: {
          [arrayId]: arrayVariable(3),
        },
      },
    );

    sb.arraySetToScriptValues(arrayId, []);

    expect(output).toEqual([
      "        ; Array Set",
      "        VM_RPN",
      "            .R_INT16    0",
      "            .R_REF_SET  ^/(VAR_ARRAY + 0)/",
      "            .R_INT16    0",
      "            .R_REF_SET  ^/(VAR_ARRAY + 1)/",
      "            .R_INT16    0",
      "            .R_REF_SET  ^/(VAR_ARRAY + 2)/",
      "            .R_STOP",
      "",
    ]);
  });

  test("should ignore values beyond array length", async () => {
    const { sb, output } = await createTestScriptBuilder(
      {},
      {
        variablesLookup: {
          [arrayId]: arrayVariable(2),
        },
      },
    );

    sb.arraySetToScriptValues(arrayId, [
      { type: "number", value: 10 },
      { type: "number", value: 20 },
      { type: "number", value: 30 },
    ]);

    expect(output).toEqual([
      "        ; Array Set",
      "        VM_RPN",
      "            .R_INT16    10",
      "            .R_REF_SET  ^/(VAR_ARRAY + 0)/",
      "            .R_INT16    20",
      "            .R_REF_SET  ^/(VAR_ARRAY + 1)/",
      "            .R_STOP",
      "",
    ]);
  });

  test("should accept array root variable reference", async () => {
    const { sb, output } = await createTestScriptBuilder(
      {},
      {
        variablesLookup: {
          [arrayId]: arrayVariable(2),
        },
      },
    );

    sb.arraySetToScriptValues(
      {
        type: "variable",
        value: arrayId,
      },
      [
        { type: "number", value: 10 },
        { type: "number", value: 20 },
      ],
    );

    expect(output).toEqual([
      "        ; Array Set",
      "        VM_RPN",
      "            .R_INT16    10",
      "            .R_REF_SET  ^/(VAR_ARRAY + 0)/",
      "            .R_INT16    20",
      "            .R_REF_SET  ^/(VAR_ARRAY + 1)/",
      "            .R_STOP",
      "",
    ]);
  });

  test("should set array elements from variables", async () => {
    const { sb, output } = await createTestScriptBuilder(
      {},
      {
        variablesLookup: {
          [arrayId]: arrayVariable(2),
          [sourceId]: {
            id: sourceId,
            name: "Source",
            symbol: "var_source",
            type: "number",
          },
        },
      },
    );

    sb.arraySetToScriptValues(arrayId, [
      {
        type: "variable",
        value: sourceId,
      },
      {
        type: "number",
        value: 20,
      },
    ]);

    expect(output).toEqual([
      "        ; Array Set",
      "        VM_RPN",
      "            .R_REF      VAR_SOURCE",
      "            .R_REF_SET  ^/(VAR_ARRAY + 0)/",
      "            .R_INT16    20",
      "            .R_REF_SET  ^/(VAR_ARRAY + 1)/",
      "            .R_STOP",
      "",
    ]);
  });

  test("should set indirect array to constant values", async () => {
    const { sb, output } = await createTestScriptBuilder(
      {},
      {
        argLookup: {
          actor: new Map(),
          variable: new Map([
            ["V0", indirectArrayArg(".SCRIPT_ARG_INDIRECT_0_VARIABLE", 3)],
          ]),
        },
      },
    );

    sb.arraySetToScriptValues("V0", [
      { type: "number", value: 10 },
      { type: "number", value: 20 },
      { type: "number", value: 30 },
    ]);

    expect(output).toEqual([
      "        ; Array Set",
      "        VM_RPN",
      "            .R_INT16    10",
      "            .R_REF_SET_IND .SCRIPT_ARG_INDIRECT_0_VARIABLE",
      "            .R_INT16    20",
      "            .R_REF      .SCRIPT_ARG_INDIRECT_0_VARIABLE",
      "            .R_INT16    1",
      "            .R_OPERATOR .ADD",
      "            .R_REF_SET  .LOCAL_TMP0_ARRAY_ADDR",
      "            .R_REF_SET_IND .LOCAL_TMP0_ARRAY_ADDR",
      "            .R_INT16    30",
      "            .R_REF      .SCRIPT_ARG_INDIRECT_0_VARIABLE",
      "            .R_INT16    2",
      "            .R_OPERATOR .ADD",
      "            .R_REF_SET  .LOCAL_TMP0_ARRAY_ADDR",
      "            .R_REF_SET_IND .LOCAL_TMP0_ARRAY_ADDR",
      "            .R_STOP",
      "",
    ]);
  });

  test("should zero out missing values in indirect array", async () => {
    const { sb, output } = await createTestScriptBuilder(
      {},
      {
        argLookup: {
          actor: new Map(),
          variable: new Map([
            ["V0", indirectArrayArg(".SCRIPT_ARG_INDIRECT_0_VARIABLE", 3)],
          ]),
        },
      },
    );

    sb.arraySetToScriptValues("V0", [{ type: "number", value: 42 }]);

    expect(output).toEqual([
      "        ; Array Set",
      "        VM_RPN",
      "            .R_INT16    42",
      "            .R_REF_SET_IND .SCRIPT_ARG_INDIRECT_0_VARIABLE",
      "            .R_INT16    0",
      "            .R_REF      .SCRIPT_ARG_INDIRECT_0_VARIABLE",
      "            .R_INT16    1",
      "            .R_OPERATOR .ADD",
      "            .R_REF_SET  .LOCAL_TMP0_ARRAY_ADDR",
      "            .R_REF_SET_IND .LOCAL_TMP0_ARRAY_ADDR",
      "            .R_INT16    0",
      "            .R_REF      .SCRIPT_ARG_INDIRECT_0_VARIABLE",
      "            .R_INT16    2",
      "            .R_OPERATOR .ADD",
      "            .R_REF_SET  .LOCAL_TMP0_ARRAY_ADDR",
      "            .R_REF_SET_IND .LOCAL_TMP0_ARRAY_ADDR",
      "            .R_STOP",
      "",
    ]);
  });

  test("should not calculate an offset for single element indirect array", async () => {
    const { sb, output } = await createTestScriptBuilder(
      {},
      {
        argLookup: {
          actor: new Map(),
          variable: new Map([
            ["V0", indirectArrayArg(".SCRIPT_ARG_INDIRECT_0_VARIABLE", 1)],
          ]),
        },
      },
    );

    sb.arraySetToScriptValues("V0", [{ type: "number", value: 42 }]);

    expect(output).toEqual([
      "        ; Array Set",
      "        VM_RPN",
      "            .R_INT16    42",
      "            .R_REF_SET_IND .SCRIPT_ARG_INDIRECT_0_VARIABLE",
      "            .R_STOP",
      "",
    ]);
  });

  test("should accept indirect array root variable reference", async () => {
    const { sb, output } = await createTestScriptBuilder(
      {},
      {
        argLookup: {
          actor: new Map(),
          variable: new Map([
            ["V0", indirectArrayArg(".SCRIPT_ARG_INDIRECT_0_VARIABLE", 2)],
          ]),
        },
      },
    );

    sb.arraySetToScriptValues(
      {
        type: "variable",
        value: "V0",
      },
      [
        { type: "number", value: 10 },
        { type: "number", value: 20 },
      ],
    );

    expect(output).toEqual([
      "        ; Array Set",
      "        VM_RPN",
      "            .R_INT16    10",
      "            .R_REF_SET_IND .SCRIPT_ARG_INDIRECT_0_VARIABLE",
      "            .R_INT16    20",
      "            .R_REF      .SCRIPT_ARG_INDIRECT_0_VARIABLE",
      "            .R_INT16    1",
      "            .R_OPERATOR .ADD",
      "            .R_REF_SET  .LOCAL_TMP0_ARRAY_ADDR",
      "            .R_REF_SET_IND .LOCAL_TMP0_ARRAY_ADDR",
      "            .R_STOP",
      "",
    ]);
  });

  test("should reject non-array variable", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        variablesLookup: {
          [arrayId]: {
            id: arrayId,
            name: "Variable",
            symbol: "var_value",
            type: "number",
          },
        },
      },
    );

    expect(() =>
      sb.arraySetToScriptValues(arrayId, [{ type: "number", value: 10 }]),
    ).toThrow();
  });

  test("should reject indexed array variable", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        variablesLookup: {
          [arrayId]: arrayVariable(3),
        },
      },
    );

    expect(() =>
      sb.arraySetToScriptValues(
        {
          type: "variable",
          value: arrayId,
          index: {
            type: "number",
            value: 1,
          },
        },
        [{ type: "number", value: 10 }],
      ),
    ).toThrow();
  });

  test("should reject indirect argument that is not an array", async () => {
    const { sb } = await createTestScriptBuilder(
      {},
      {
        argLookup: {
          actor: new Map(),
          variable: new Map([
            [
              "V0",
              {
                type: "argument" as const,
                indirect: true,
                array: false,
                symbol: ".SCRIPT_ARG_INDIRECT_0_VARIABLE",
              },
            ],
          ]),
        },
      },
    );

    expect(() =>
      sb.arraySetToScriptValues("V0", [{ type: "number", value: 10 }]),
    ).toThrow();
  });
});
