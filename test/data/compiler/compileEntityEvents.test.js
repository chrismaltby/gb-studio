import compileEntityEvents from "../../../src/lib/compiler/compileEntityEvents";
import {
  EVENT_END,
  EVENT_TEXT,
  EVENT_IF_TRUE,
  EVENT_SET_TRUE,
} from "../../../src/lib/compiler/eventTypes";

jest.mock("../../../src/consts");

const CMD_LOOKUP = {
  END: 0x00, // done
  TEXT: 0x01, // - done
  JUMP: 0x02,
  IF_TRUE: 0x03,
  // script_cmd_unless_variable: 0x04,
  SET_TRUE: 0x05,
  SET_FALSE: 0x06,
  ACTOR_SET_DIRECTION: 0x07,
  ACTOR_SET_ACTIVE: 0x08,
  CAMERA_MOVE_TO: 0x09,
  CAMERA_LOCK: 0x0a,
  WAIT: 0x0b,
  FADE_OUT: 0x0c,
  FADE_IN: 0x0d,
  SWITCH_SCENE: 0x0e,
  ACTOR_SET_POSITION: 0x0f,
  ACTOR_MOVE_TO: 0x10,
  SHOW_SPRITES: 0x11,
  HIDE_SPRITES: 0x12,
  PLAYER_SET_SPRITE: 0x13,
  ACTOR_SHOW: 0x14,
  ACTOR_HIDE: 0x15,
  ACTOR_EMOTE: 0x16,
  CAMERA_SHAKE: 0x17,
  RETURN_TO_TITLE: 0x18,
  OVERLAY_SHOW: 0x19,
  OVERLAY_HIDE: 0x1a,
  OVERLAY_SET_POSITION: 0x1b,
  OVERLAY_MOVE_TO: 0x1c,
  AWAIT_INPUT: 0x1d,
  MUSIC_PLAY: 0x1e,
  MUSIC_STOP: 0x1f,
  RESET_VARIABLES: 0x20,
  NEXT_FRAME: 0x21,
  INC_VALUE: 0x22,
  DEC_VALUE: 0x23,
  SET_VALUE: 0x24,
  IF_VALUE: 0x25,
  IF_INPUT: 0x26,
  CHOICE: 0x27,
  ACTOR_PUSH: 0x28,
  IF_ACTOR_AT_POSITION: 0x29,
  LOAD_DATA: 0x2a,
  SAVE_DATA: 0x2b,
  CLEAR_DATA: 0x2c,
  IF_SAVED_DATA: 0x2d,
  IF_ACTOR_DIRECTION: 0x2e,
  SET_RANDOM_VALUE: 0x2f,
  ACTOR_GET_POSITION: 0x30,
  ACTOR_SET_POSITION_TO_VALUE: 0x31,
  ACTOR_MOVE_TO_VALUE: 0x32,
  ACTOR_MOVE_RELATIVE: 0x33,
  ACTOR_SET_POSITION_RELATIVE: 0x34,
  MATH_ADD: 0x35,
  MATH_SUB: 0x36,
  MATH_MUL: 0x37,
  MATH_DIV: 0x38,
  MATH_MOD: 0x39,
  MATH_ADD_VALUE: 0x3a,
  MATH_SUB_VALUE: 0x3b,
  MATH_MUL_VALUE: 0x3c,
  MATH_DIV_VALUE: 0x3d,
  MATH_MOD_VALUE: 0x3e,
  COPY_VALUE: 0x3f,
  IF_VALUE_COMPARE: 0x40,
  LOAD_VECTORS: 0x41,
  ACTOR_SET_MOVE_SPEED: 0x42,
  ACTOR_SET_ANIM_SPEED: 0x43,
  TEXT_SET_ANIM_SPEED: 0x44,
  SCENE_PUSH_STATE: 0x45,
  SCENE_POP_STATE: 0x46,
  ACTOR_INVOKE: 0x47,
  STACK_PUSH: 0x48,
  STACK_POP: 0x49,
  SCENE_STATE_RESET: 0x4a,
  SCENE_POP_ALL_STATE: 0x4b,
  SET_INPUT_SCRIPT: 0x4c,
  REMOVE_INPUT_SCRIPT: 0x4d,
  ACTOR_SET_FRAME: 0x4e,
  ACTOR_SET_FLIP: 0x4f,
  TEXT_MULTI: 0x50,
  ACTOR_SET_FRAME_TO_VALUE: 0x51,
  TEXT_WITH_AVATAR: 0x5b,
};

test("should compile empty events", () => {
  const input = [];
  const output = compileEntityEvents("testname", input);
  expect(output).toEqual(`.include "vm.i"
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
  expect(output).toEqual(`.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255

___bank_testname = 255
.globl ___bank_testname

_testname::
        ; Stop Script
        VM_STOP
`);
});

test("should output text command", () => {
  const input = [
    {
      command: EVENT_TEXT,
      args: {
        text: "HELLO WORLD",
      },
    },
  ];
  const strings = ["HELLO WORLD"];
  const output = compileEntityEvents("testname", input, { strings });
  expect(output).toEqual(`.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255

___bank_testname = 255
.globl ___bank_testname

_testname::
        ; Text Dialogue
        VM_LOAD_TEXT            0
        .asciz "HELLO WORLD"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, ^/(.UI_AUTO_SCROLL | .UI_DRAW_FRAME)/
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_TEXT_IN_SPEED
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_TEXT_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        ; Stop Script
        VM_STOP
`);
});

test("should output text with avatar command", () => {
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
  const output = compileEntityEvents("testname", input, { strings, avatars });
  expect(output).toEqual(`.include "vm.i"
.include "data/game_globals.i"

.area _CODE_255

___bank_testname = 255
.globl ___bank_testname

_testname::
        ; Text Dialogue
        VM_LOAD_TEXT            0
        .asciz "\\001\\001\\002\\001@A\\nBC\\001\\003\\004\\001\\377\\002\\001HELLO WORLD"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, ^/(.UI_AUTO_SCROLL | .UI_DRAW_FRAME)/
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_TEXT_IN_SPEED
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_TEXT_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        ; Stop Script
        VM_STOP
`);
});

test("should allow conditional statements", () => {
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
  const output = compileEntityEvents("testname", input, { strings, variables });
  expect(output).toEqual(`.include "vm.i"
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
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_TEXT_IN_SPEED
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_TEXT_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        VM_JUMP                 2$
1$:
        ; Text Dialogue
        VM_LOAD_TEXT            0
        .asciz "TRUE PATH"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, ^/(.UI_AUTO_SCROLL | .UI_DRAW_FRAME)/
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_TEXT_IN_SPEED
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_TEXT_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

2$:

        ; Stop Script
        VM_STOP
`);
});

test("should allow commands after conditional", () => {
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
  const output = compileEntityEvents("testname", input, { strings, variables });
  expect(output).toEqual(`.include "vm.i"
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
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_TEXT_IN_SPEED
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_TEXT_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        VM_JUMP                 2$
1$:
        ; Text Dialogue
        VM_LOAD_TEXT            0
        .asciz "TRUE PATH"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, ^/(.UI_AUTO_SCROLL | .UI_DRAW_FRAME)/
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_TEXT_IN_SPEED
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_TEXT_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

2$:

        ; Text Dialogue
        VM_LOAD_TEXT            0
        .asciz "AFTER"
        VM_OVERLAY_CLEAR        0, 0, 20, 4, .UI_COLOR_WHITE, ^/(.UI_AUTO_SCROLL | .UI_DRAW_FRAME)/
        VM_OVERLAY_MOVE_TO      0, 14, .OVERLAY_TEXT_IN_SPEED
        VM_DISPLAY_TEXT
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT | .UI_WAIT_BTN_A)/
        VM_OVERLAY_MOVE_TO      0, 18, .OVERLAY_TEXT_OUT_SPEED
        VM_OVERLAY_WAIT         .UI_MODAL, ^/(.UI_WAIT_WINDOW | .UI_WAIT_TEXT)/

        ; Stop Script
        VM_STOP
`);
});
