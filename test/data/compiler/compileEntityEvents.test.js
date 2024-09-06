import compileEntityEvents from "../../../src/lib/compiler/compileEntityEvents";
import { EVENT_END, EVENT_TEXT, EVENT_IF_TRUE } from "../../../src/consts";
import { getDummyCompiledFont } from "../../dummydata";
import { getTestScriptHandlers } from "../../getTestScriptHandlers";

jest.mock("../../../src/consts");

test("should compile empty events", async () => {
  const scriptEventHandlers = await getTestScriptHandlers();
  const input = [];
  const output = compileEntityEvents("testname", input, {
    scriptEventHandlers,
  });
  expect(output).toEqual(`.module testname

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255


___bank_testname = 255
.globl ___bank_testname

_testname::
        ; Stop Script
        VM_STOP
`);
});

test("should collapse multiple end events", async () => {
  const scriptEventHandlers = await getTestScriptHandlers();
  const input = [
    {
      command: EVENT_END,
    },
    {
      command: EVENT_END,
    },
  ];
  const output = compileEntityEvents("testname", input, {
    scriptEventHandlers,
  });
  expect(output).toEqual(`.module testname

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255


___bank_testname = 255
.globl ___bank_testname

_testname::
        ; Stop Script
        VM_STOP
`);
});

test("should output text command", async () => {
  const scriptEventHandlers = await getTestScriptHandlers();
  const dummyCompiledFont = await getDummyCompiledFont();
  const input = [
    {
      command: EVENT_TEXT,
      args: {
        text: "HELLO WORLD",
      },
    },
  ];
  const strings = ["HELLO WORLD"];
  const output = compileEntityEvents("testname", input, {
    scriptEventHandlers,
    strings,
    fonts: [dummyCompiledFont],
  });
  expect(output).toEqual(`.module testname

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255


___bank_testname = 255
.globl ___bank_testname

_testname::
        ; Text Dialogue
        VM_LOAD_TEXT            0
        .asciz "HELLO WORLD"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_SPEED_INSTANT
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_OVERLAY_SET_SCROLL   1, 1, 18, 5, .UI_COLOR_WHITE
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        ; Stop Script
        VM_STOP
`);
});

test("should output text with avatar command", async () => {
  const scriptEventHandlers = await getTestScriptHandlers();
  const dummyCompiledFont = await getDummyCompiledFont();

  const input = [
    {
      command: EVENT_TEXT,
      args: {
        text: "HELLO WORLD",
        avatarId: 2,
      },
    },
  ];
  const strings = ["HELLO WORLD"];
  const avatars = [
    {
      id: 2,
    },
  ];

  const fonts = [dummyCompiledFont];

  const output = compileEntityEvents("testname", input, {
    scriptEventHandlers,
    strings,
    avatars,
    fonts,
  });
  expect(output).toEqual(`.module testname

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255


___bank_testname = 255
.globl ___bank_testname

_testname::
        ; Text Dialogue
        VM_LOAD_TEXT            0
        .asciz "\\001\\001\\002\\002@A\\nBC\\001\\003\\004\\001\\377\\002\\001HELLO WORLD"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_SPEED_INSTANT
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_OVERLAY_SET_SCROLL   3, 1, 15, 5, .UI_COLOR_WHITE
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        ; Stop Script
        VM_STOP
`);
});

test("should allow conditional statements", async () => {
  const scriptEventHandlers = await getTestScriptHandlers();
  const dummyCompiledFont = await getDummyCompiledFont();

  const input = [
    {
      command: EVENT_IF_TRUE,
      args: {
        variable: "4",
      },
      children: {
        true: [
          {
            command: EVENT_TEXT,
            args: {
              text: "TRUE PATH",
            },
          },
        ],
        false: [
          {
            command: EVENT_TEXT,
            args: {
              text: "FALSE PATH",
            },
          },
        ],
      },
    },
  ];
  const strings = ["HELLO WORLD", "TRUE PATH", "FALSE PATH"];
  const variables = ["1", "2", "3", "4"];
  const fonts = [dummyCompiledFont];
  const output = compileEntityEvents("testname", input, {
    scriptEventHandlers,
    strings,
    variables,
    fonts,
  });
  expect(output).toEqual(`.module testname

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255


___bank_testname = 255
.globl ___bank_testname

_testname::
        ; If Variable True
        VM_IF_CONST             .GT, VAR_VARIABLE_4, 0, 1$, 0
        ; Text Dialogue
        VM_LOAD_TEXT            0
        .asciz "FALSE PATH"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_SPEED_INSTANT
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_OVERLAY_SET_SCROLL   1, 1, 18, 5, .UI_COLOR_WHITE
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        VM_JUMP                 2$
1$:
        ; Text Dialogue
        VM_LOAD_TEXT            0
        .asciz "TRUE PATH"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_SPEED_INSTANT
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_OVERLAY_SET_SCROLL   1, 1, 18, 5, .UI_COLOR_WHITE
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

2$:

        ; Stop Script
        VM_STOP
`);
});

test("should allow commands after conditional", async () => {
  const scriptEventHandlers = await getTestScriptHandlers();
  const dummyCompiledFont = await getDummyCompiledFont();
  const input = [
    {
      command: EVENT_IF_TRUE,
      args: {
        variable: "4",
      },
      children: {
        true: [
          {
            command: EVENT_TEXT,
            args: {
              text: "TRUE PATH",
            },
          },
        ],
        false: [
          {
            command: EVENT_TEXT,
            args: {
              text: "FALSE PATH",
            },
          },
        ],
      },
    },
    {
      command: EVENT_TEXT,
      args: {
        text: "AFTER",
      },
    },
  ];
  const strings = ["HELLO WORLD", "TRUE PATH", "FALSE PATH", "AFTER"];
  const variables = ["1", "2", "3", "4"];
  const fonts = [dummyCompiledFont];
  const output = compileEntityEvents("testname", input, {
    scriptEventHandlers,
    strings,
    variables,
    fonts,
  });
  expect(output).toEqual(`.module testname

.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255


___bank_testname = 255
.globl ___bank_testname

_testname::
        ; If Variable True
        VM_IF_CONST             .GT, VAR_VARIABLE_4, 0, 1$, 0
        ; Text Dialogue
        VM_LOAD_TEXT            0
        .asciz "FALSE PATH"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_SPEED_INSTANT
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_OVERLAY_SET_SCROLL   1, 1, 18, 5, .UI_COLOR_WHITE
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        VM_JUMP                 2$
1$:
        ; Text Dialogue
        VM_LOAD_TEXT            0
        .asciz "TRUE PATH"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_SPEED_INSTANT
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_OVERLAY_SET_SCROLL   1, 1, 18, 5, .UI_COLOR_WHITE
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

2$:

        ; Text Dialogue
        VM_LOAD_TEXT            0
        .asciz "AFTER"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, .UI_DRAW_FRAME
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_SPEED_INSTANT
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_OVERLAY_SET_SCROLL   1, 1, 18, 5, .UI_COLOR_WHITE
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        ; Stop Script
        VM_STOP
`);
});

test("should be able to set script to run when saved data resumes", async () => {
  const scriptEventHandlers = await getTestScriptHandlers();
  const input = [
    {
      id: "event1",
      command: "EVENT_SAVE_DATA",
      args: {
        saveSlot: 0,
        __scriptTabs: "save",
      },
      children: {
        true: [
          {
            id: "event2",
            command: "EVENT_GBVM_SCRIPT",
            args: {
              script: 'VM_DEBUG        0\n.asciz "OnSave Path"',
            },
          },
        ],
        load: [
          {
            id: "event3",
            command: "EVENT_GBVM_SCRIPT",
            args: {
              script: 'VM_DEBUG        0\n.asciz "OnLoad Path"',
            },
          },
        ],
      },
    },
  ];
  const output = compileEntityEvents("testname", input, {
    scriptEventHandlers,
  });
  expect(output).toEqual(`.module testname

.include "vm.i"
.include "data/game_globals.i"

.globl _fade_frames_per_step

.area _CODE_255

.LOCAL_TMP0_HAS_LOADED = -1

___bank_testname = 255
.globl ___bank_testname

_testname::
        VM_RESERVE              1

        ; Save Data to Slot 0
        VM_RAISE                EXCEPTION_SAVE, 1
            .SAVE_SLOT 0
        VM_POLL_LOADED          .LOCAL_TMP0_HAS_LOADED
        VM_IF_CONST             .EQ, .LOCAL_TMP0_HAS_LOADED, 1, 1$, 0

        VM_DEBUG        0
        .asciz "OnSave Path"

        VM_JUMP                 2$
1$:
        VM_DEBUG        0
        .asciz "OnLoad Path"

        ; Wait 1 Frames
        VM_IDLE

        ; Fade In
        VM_SET_CONST_INT8       _fade_frames_per_step, 3
        VM_FADE_IN              1

2$:

        ; Stop Script
        VM_STOP
`);
});

test("should inject fadein correctly when saved data resumes", async () => {
  const scriptEventHandlers = await getTestScriptHandlers();
  const input = [
    {
      id: "event1",
      command: "EVENT_SAVE_DATA",
      args: {
        saveSlot: 0,
        __scriptTabs: "save",
      },
      children: {
        true: [
          {
            id: "event2",
            command: "EVENT_GBVM_SCRIPT",
            args: {
              script: 'VM_DEBUG        0\n.asciz "OnSave Path"',
            },
          },
        ],
        load: [
          {
            id: "event4",
            command: "EVENT_ACTOR_EMOTE",
            args: {
              actorId: "$self$",
              emoteId: "603fd18d-674c-4360-9f57-5fb4b935b442",
            },
          },
          {
            id: "event3",
            command: "EVENT_GBVM_SCRIPT",
            args: {
              script: 'VM_DEBUG        0\n.asciz "OnLoad Path"',
            },
          },
        ],
      },
    },
  ];
  const output = compileEntityEvents("testname", input, {
    scriptEventHandlers,
  });
  expect(output).toEqual(`.module testname

.include "vm.i"
.include "data/game_globals.i"

.globl _fade_frames_per_step

.area _CODE_255

.LOCAL_TMP0_HAS_LOADED = -4
.LOCAL_ACTOR = -4

___bank_testname = 255
.globl ___bank_testname

_testname::
        VM_RESERVE              4

        ; Save Data to Slot 0
        VM_RAISE                EXCEPTION_SAVE, 1
            .SAVE_SLOT 0
        VM_POLL_LOADED          .LOCAL_TMP0_HAS_LOADED
        VM_IF_CONST             .EQ, .LOCAL_TMP0_HAS_LOADED, 1, 1$, 0

        VM_DEBUG        0
        .asciz "OnSave Path"

        VM_JUMP                 2$
1$:
        ; Wait 1 Frames
        VM_IDLE

        ; Fade In
        VM_SET_CONST_INT8       _fade_frames_per_step, 3
        VM_FADE_IN              1

        ; Actor Set Active
        VM_SET_CONST            .LOCAL_ACTOR, 0

        VM_DEBUG        0
        .asciz "OnLoad Path"

2$:

        ; Stop Script
        VM_STOP
`);
});

test("should inject fadein even when no saved data onload is defined", async () => {
  const scriptEventHandlers = await getTestScriptHandlers();
  const input = [
    {
      id: "event1",
      command: "EVENT_SAVE_DATA",
      args: {
        saveSlot: 0,
        __scriptTabs: "save",
      },
    },
  ];
  const output = compileEntityEvents("testname", input, {
    scriptEventHandlers,
  });
  expect(output).toEqual(`.module testname

.include "vm.i"
.include "data/game_globals.i"

.globl _fade_frames_per_step

.area _CODE_255

.LOCAL_TMP0_HAS_LOADED = -1

___bank_testname = 255
.globl ___bank_testname

_testname::
        VM_RESERVE              1

        ; Save Data to Slot 0
        VM_RAISE                EXCEPTION_SAVE, 1
            .SAVE_SLOT 0
        VM_POLL_LOADED          .LOCAL_TMP0_HAS_LOADED
        VM_IF_CONST             .EQ, .LOCAL_TMP0_HAS_LOADED, 1, 1$, 0

        VM_JUMP                 2$
1$:
        ; Wait 1 Frames
        VM_IDLE

        ; Fade In
        VM_SET_CONST_INT8       _fade_frames_per_step, 3
        VM_FADE_IN              1

2$:

        ; Stop Script
        VM_STOP
`);
});
