import { precompileScriptValue } from "shared/lib/scriptValue/helpers";
import { PrecompiledScene } from "../../src/lib/compiler/generateGBVMData";
import ScriptBuilder, {
  ScriptBuilderOptions,
} from "../../src/lib/compiler/scriptBuilder";
import {
  CustomEvent,
  ScriptEvent,
} from "../../src/shared/lib/entities/entitiesTypes";
import {
  dummyActorNormalized,
  dummyEngineFieldSchema,
  dummyPrecompiledBackground,
  dummyPrecompiledSpriteSheet,
  getDummyCompiledFont,
} from "../dummydata";
import { getTestScriptHandlers } from "../getTestScriptHandlers";

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
  sb.actorMoveTo(5, 6, true, "horizontal");
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
  sb.wait(20);
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
  sb.actorMoveTo(5, 6, true, "horizontal");
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
    compileEvents: (self: ScriptBuilder, events: ScriptEvent[]) => {
      if (events[0].id === "event1") {
        output.push("        VM_DEBUG                0");
        output.push('        .asciz "True Path"');
      } else {
        output.push("        VM_DEBUG                0");
        output.push('        .asciz "False Path"');
      }
    },
  });
  sb.ifVariableTrue(
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
    compileEvents: (self: ScriptBuilder, events: ScriptEvent[]) => {
      if (events[0].id === "event1") {
        output.push("        VM_DEBUG        0");
        output.push('        .asciz "True Path"');
      } else {
        output.push("        VM_DEBUG        0");
        output.push('        .asciz "False Path"');
      }
    },
  });
  sb.ifVariableTrue(
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

  sb.ifVariableTrue(
    "0",
    // 0 == True
    () =>
      sb.ifVariableTrue(
        "1",
        () => sb.textDialogue("0=TRUE 1=TRUE"), // 1 == True
        () => sb.textDialogue("0=TRUE 1=FALSE"), // 1 == False
      ),
    // 0 == False
    () =>
      sb.ifVariableTrue(
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
  expect(recursiveSymbolMap[placeholder]).toEqual("script_1");
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

  const customEvents: CustomEvent[] = [
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

  const customEvents: CustomEvent[] = [
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
  expect(recursiveSymbolMap[placeholder]).toEqual("script_1");
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
  expect(recursiveSymbolMap[placeholder]).toEqual("script_1");
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
});
