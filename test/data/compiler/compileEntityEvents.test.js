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
        VM_IF_CONST .GT         VAR_VARIABLE_4, 0, 1$, 0
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
        VM_IF_CONST .GT         VAR_VARIABLE_4, 0, 1$, 0
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

test("Should generate scene init fade in before a waitUntilAfterInitFade event", () => {
  const output = compileEntityEvents(
    `MY_SCRIPT`,
    [
      {
        command: "EVENT_CAMERA_SHAKE",
        args: {
          time: "0.1",
          shakeDirection: "horizontal",
        },
      },
    ],
    {
      init: true,
    }
  );

  expect(output).toEqual(
    `.module MY_SCRIPT

.include "vm.i"
.include "data/game_globals.i"

.globl b_wait_frames, _wait_frames, _fade_frames_per_step, b_camera_shake_frames, _camera_shake_frames

.area _CODE_255


___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

_MY_SCRIPT::
        ; Wait 1 Frame
        VM_PUSH_CONST           1
        VM_INVOKE               b_wait_frames, _wait_frames, 1, .ARG0

        ; Fade In
        VM_SET_CONST_INT8       _fade_frames_per_step, 1
        VM_FADE_IN              1

        ; Camera Shake
        VM_PUSH_CONST           30
        VM_PUSH_CONST           .CAMERA_SHAKE_X
        VM_INVOKE               b_camera_shake_frames, _camera_shake_frames, 2, .ARG1
        ; Stop Script
        VM_STOP
`
  );
});

test("Should not generate scene init fade in until reached waitUntilAfterInitFade event", () => {
  const output = compileEntityEvents(
    `MY_SCRIPT`,
    [
      {
        command: "EVENT_INC_VALUE",
        args: {
          variable: "0",
        },
      },
      {
        command: "EVENT_CAMERA_SHAKE",
        args: {
          time: "0.1",
          shakeDirection: "horizontal",
        },
      },
    ],
    {
      init: true,
    }
  );

  expect(output).toEqual(
    `.module MY_SCRIPT

.include "vm.i"
.include "data/game_globals.i"

.globl b_wait_frames, _wait_frames, _fade_frames_per_step, b_camera_shake_frames, _camera_shake_frames

.area _CODE_255


___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

_MY_SCRIPT::
        ; Variable Increment By 1
        VM_RPN
            .R_REF      VAR_VARIABLE_0
            .R_INT8     1
            .R_OPERATOR .ADD
            .R_STOP
        VM_SET                  VAR_VARIABLE_0, .ARG0
        VM_POP                  1

        ; Wait 1 Frame
        VM_PUSH_CONST           1
        VM_INVOKE               b_wait_frames, _wait_frames, 1, .ARG0

        ; Fade In
        VM_SET_CONST_INT8       _fade_frames_per_step, 1
        VM_FADE_IN              1

        ; Camera Shake
        VM_PUSH_CONST           30
        VM_PUSH_CONST           .CAMERA_SHAKE_X
        VM_INVOKE               b_camera_shake_frames, _camera_shake_frames, 2, .ARG1
        ; Stop Script
        VM_STOP
`
  );
});

test("Should generate scene init fade in at end of script when required", () => {
  const output = compileEntityEvents(
    `MY_SCRIPT`,
    [
      {
        command: "EVENT_INC_VALUE",
        args: {
          variable: "0",
        },
      },
    ],
    {
      init: true,
    }
  );

  expect(output).toEqual(
    `.module MY_SCRIPT

.include "vm.i"
.include "data/game_globals.i"

.globl b_wait_frames, _wait_frames, _fade_frames_per_step

.area _CODE_255


___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

_MY_SCRIPT::
        ; Variable Increment By 1
        VM_RPN
            .R_REF      VAR_VARIABLE_0
            .R_INT8     1
            .R_OPERATOR .ADD
            .R_STOP
        VM_SET                  VAR_VARIABLE_0, .ARG0
        VM_POP                  1

        ; Wait 1 Frame
        VM_PUSH_CONST           1
        VM_INVOKE               b_wait_frames, _wait_frames, 1, .ARG0

        ; Fade In
        VM_SET_CONST_INT8       _fade_frames_per_step, 1
        VM_FADE_IN              1

        ; Stop Script
        VM_STOP
`
  );
});

test("Should not generate scene init fade in if manual fade is provided", () => {
  const output = compileEntityEvents(
    `MY_SCRIPT`,
    [
      {
        command: "EVENT_FADE_IN",
        args: {
          speed: "6",
        },
      },
    ],
    {
      init: true,
    }
  );

  expect(output).toEqual(
    `.module MY_SCRIPT

.include "vm.i"
.include "data/game_globals.i"

.globl b_wait_frames, _wait_frames, _fade_frames_per_step

.area _CODE_255


___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

_MY_SCRIPT::
        ; Wait 1 Frame
        VM_PUSH_CONST           1
        VM_INVOKE               b_wait_frames, _wait_frames, 1, .ARG0

        ; Fade In
        VM_SET_CONST_INT8       _fade_frames_per_step, 63
        VM_FADE_IN              1

        ; Stop Script
        VM_STOP
`
  );
});

test("Should generate scene init fade in before a conditional that contains waitUntilAfterInitFade events", () => {
  const output = compileEntityEvents(
    `MY_SCRIPT`,
    [
      {
        command: "EVENT_IF_TRUE",
        args: {
          variable: "0",
        },
        children: {
          true: [
            {
              command: "EVENT_CAMERA_SHAKE",
              args: {
                time: "0.1",
                shakeDirection: "horizontal",
              },
            },
          ],
          false: [
            {
              command: "EVENT_CAMERA_SHAKE",
              args: {
                time: "0.1",
                shakeDirection: "horizontal",
              },
            },
          ],
        },
      },
    ],
    {
      warnings: (e: string) => {
        console.error(e);
      },
      init: true,
    }
  );

  expect(output).toEqual(
    `.module MY_SCRIPT

.include "vm.i"
.include "data/game_globals.i"

.globl b_wait_frames, _wait_frames, _fade_frames_per_step, b_camera_shake_frames, _camera_shake_frames

.area _CODE_255


___bank_MY_SCRIPT = 255
.globl ___bank_MY_SCRIPT

_MY_SCRIPT::
        ; Wait 1 Frame
        VM_PUSH_CONST           1
        VM_INVOKE               b_wait_frames, _wait_frames, 1, .ARG0

        ; Fade In
        VM_SET_CONST_INT8       _fade_frames_per_step, 1
        VM_FADE_IN              1

        ; If Variable True
        VM_IF_CONST .GT         VAR_VARIABLE_0, 0, 1$, 0
        ; Camera Shake
        VM_PUSH_CONST           30
        VM_PUSH_CONST           .CAMERA_SHAKE_X
        VM_INVOKE               b_camera_shake_frames, _camera_shake_frames, 2, .ARG1
        VM_JUMP                 2$
1$:
        ; Camera Shake
        VM_PUSH_CONST           30
        VM_PUSH_CONST           .CAMERA_SHAKE_X
        VM_INVOKE               b_camera_shake_frames, _camera_shake_frames, 2, .ARG1
2$:

        ; Stop Script
        VM_STOP
`
  );
});
