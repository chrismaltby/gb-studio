import { Dictionary } from "@reduxjs/toolkit";
import { PrecompiledScene } from "../../../src/lib/compiler/generateGBVMData";
import ScriptBuilder, {
  ScriptBuilderOptions,
} from "../../../src/lib/compiler/scriptBuilder";
import { ScriptEvent } from "../../../src/shared/lib/entities/entitiesTypes";
import {
  dummyActorNormalized,
  dummyPrecompiledBackground,
  dummyPrecompiledSpriteSheet,
  getDummyCompiledFont,
} from "../../dummydata";
import { getTestScriptHandlers } from "../../getTestScriptHandlers";

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
    "        VM_SET_CONST            ^/(.LOCAL_ACTOR + 1)/, 640",
    "        VM_SET_CONST            ^/(.LOCAL_ACTOR + 2)/, 768",
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
    "        ; Wait N Frames",
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
        VM_SET_CONST            ^/(.LOCAL_ACTOR + 1)/, 640
        VM_SET_CONST            ^/(.LOCAL_ACTOR + 2)/, 768
        VM_SET_CONST            ^/(.LOCAL_ACTOR + 3)/, ^/(.ACTOR_ATTR_CHECK_COLL | .ACTOR_ATTR_H_FIRST)/
        VM_ACTOR_MOVE_TO        .LOCAL_ACTOR

`
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
        VM_LOAD_TEXT            0
        .asciz "Hello World"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, ^/(.UI_AUTO_SCROLL | .UI_DRAW_FRAME)/
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        ; Stop Script
        VM_STOP
`
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
    ]
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

`
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
    () => sb.textDialogue("Goodbye World")
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
        VM_LOAD_TEXT            0
        .asciz "Goodbye World"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, ^/(.UI_AUTO_SCROLL | .UI_DRAW_FRAME)/
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        VM_JUMP                 2$
1$:
        ; Text Dialogue
        VM_LOAD_TEXT            0
        .asciz "Hello World"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, ^/(.UI_AUTO_SCROLL | .UI_DRAW_FRAME)/
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

2$:

        ; Stop Script
        VM_STOP
`
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
        () => sb.textDialogue("0=TRUE 1=FALSE") // 1 == False
      ),
    // 0 == False
    () =>
      sb.ifVariableTrue(
        "2",
        () => sb.textDialogue("0=FALSE 2=TRUE"), // 2 == True
        () => sb.textDialogue("0=FALSE 2=FALSE") // 2 == False
      )
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
        VM_LOAD_TEXT            0
        .asciz "0=FALSE 2=FALSE"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, ^/(.UI_AUTO_SCROLL | .UI_DRAW_FRAME)/
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        VM_JUMP                 4$
3$:
        ; Text Dialogue
        VM_LOAD_TEXT            0
        .asciz "0=FALSE 2=TRUE"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, ^/(.UI_AUTO_SCROLL | .UI_DRAW_FRAME)/
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
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
        VM_LOAD_TEXT            0
        .asciz "0=TRUE 1=FALSE"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, ^/(.UI_AUTO_SCROLL | .UI_DRAW_FRAME)/
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        VM_JUMP                 6$
5$:
        ; Text Dialogue
        VM_LOAD_TEXT            0
        .asciz "0=TRUE 1=TRUE"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, ^/(.UI_AUTO_SCROLL | .UI_DRAW_FRAME)/
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

6$:

2$:

        ; Stop Script
        VM_STOP
`
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
`
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
    () => output.push("        ; FALSE")
  );

  expect(output).toEqual([
    "        ; If",
    "        ; -- Calculate value",
    "        VM_RPN",
    "            .R_REF      VAR_VARIABLE_0",
    "            .R_REF_SET  .LOCAL_TMP0_IF_VALUE",
    "            .R_STOP",
    "        ; If Truthy",
    "        VM_IF_CONST             .NE, .LOCAL_TMP0_IF_VALUE, 0, 1$, 0",
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
    () => output.push("        ; FALSE")
  );

  expect(output).toEqual([
    "        ; If",
    "        ; -- Calculate value",
    "        VM_RPN",
    "            .R_REF      VAR_VARIABLE_0",
    "            .R_REF_SET  .LOCAL_TMP0_IF_VALUE",
    "            .R_STOP",
    "        ; If Falsy",
    "        VM_IF_CONST             .EQ, .LOCAL_TMP0_IF_VALUE, 0, 1$, 0",
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
    () => output.push("        ; FALSE")
  );

  expect(output).toEqual([
    "        ; If",
    "        ; -- Calculate value",
    "        VM_RPN",
    "            .R_REF      VAR_VARIABLE_0",
    "            .R_REF_SET  .LOCAL_TMP0_IF_VALUE",
    "            .R_STOP",
    "        ; If Falsy",
    "        VM_IF_CONST             .EQ, .LOCAL_TMP0_IF_VALUE, 0, 1$, 0",
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
    () => output.push("        ; FALSE")
  );

  expect(output).toEqual([
    "        ; If",
    "        ; -- Calculate value",
    "        VM_RPN",
    "            .R_REF      VAR_VARIABLE_0",
    "            .R_REF_SET  .LOCAL_TMP0_IF_VALUE",
    "            .R_STOP",
    "        ; If Falsy",
    "        VM_IF_CONST             .EQ, .LOCAL_TMP0_IF_VALUE, 0, 1$, 0",
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
    () => output.push("        ; FALSE")
  );

  expect(output).toEqual([
    "        ; If",
    "        ; -- Calculate value",
    "        VM_RPN",
    "            .R_REF      VAR_VARIABLE_0",
    "            .R_REF_SET  .LOCAL_TMP0_IF_VALUE",
    "            .R_STOP",
    "        ; If Falsy",
    "        VM_IF_CONST             .EQ, .LOCAL_TMP0_IF_VALUE, 0, 1$, 0",
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
    () => output.push("        ; FALSE")
  );

  expect(output).toEqual([
    "        ; If",
    "        ; -- Calculate value",
    "        VM_RPN",
    "            .R_REF      VAR_VARIABLE_0",
    "            .R_REF_SET  .LOCAL_TMP0_IF_VALUE",
    "            .R_STOP",
    "        ; If Falsy",
    "        VM_IF_CONST             .EQ, .LOCAL_TMP0_IF_VALUE, 0, 1$, 0",
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
  const additionalScripts: Dictionary<{
    symbol: string;
    compiledScript: string;
  }> = {};
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
    `VM_SET                  .LOCAL_ACTOR, .SCRIPT_ARG_0_ACTOR`
  );
});

test("should allow passing actors to nested custom event", async () => {
  const output: string[] = [];
  const additionalScripts: Dictionary<{
    symbol: string;
    compiledScript: string;
  }> = {};
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
    `VM_SET                  .LOCAL_ACTOR, .SCRIPT_ARG_0_ACTOR`
  );
  expect(additionalScripts["script_2"]?.compiledScript).toContain(
    `VM_PUSH_VALUE           .SCRIPT_ARG_0_ACTOR`
  );
});
