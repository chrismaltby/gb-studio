import compileEntityEvents from "../../../src/lib/compiler/compileEntityEvents";
import {
  EVENT_END,
  EVENT_TEXT,
  EVENT_IF_TRUE,
} from "../../../src/lib/compiler/eventTypes";
import { getDummyCompiledFont } from "../../dummydata";

jest.mock("../../../src/consts");

test("should compile empty events", () => {
  const input = [];
  const output = compileEntityEvents("testname", input);
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

test("should collapse multiple end events", () => {
  const input = [
    {
      command: EVENT_END,
    },
    {
      command: EVENT_END,
    },
  ];
  const output = compileEntityEvents("testname", input);
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
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, ^/(.UI_AUTO_SCROLL | .UI_DRAW_FRAME)/
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        ; Stop Script
        VM_STOP
`);
});

test("should output text with avatar command", async () => {
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
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, ^/(.UI_AUTO_SCROLL | .UI_DRAW_FRAME)/
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        ; Stop Script
        VM_STOP
`);
});

test("should allow conditional statements", async () => {
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
        VM_IF_CONST .GT         VAR_4, 0, 1$, 0
        ; Text Dialogue
        VM_LOAD_TEXT            0
        .asciz "FALSE PATH"
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
        .asciz "TRUE PATH"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, ^/(.UI_AUTO_SCROLL | .UI_DRAW_FRAME)/
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
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
        VM_IF_CONST .GT         VAR_4, 0, 1$, 0
        ; Text Dialogue
        VM_LOAD_TEXT            0
        .asciz "FALSE PATH"
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
        .asciz "TRUE PATH"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, ^/(.UI_AUTO_SCROLL | .UI_DRAW_FRAME)/
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

2$:

        ; Text Dialogue
        VM_LOAD_TEXT            0
        .asciz "AFTER"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, ^/(.UI_AUTO_SCROLL | .UI_DRAW_FRAME)/
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_IN_SPEED
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        ; Stop Script
        VM_STOP
`);
});
