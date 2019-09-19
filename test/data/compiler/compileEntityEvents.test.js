import compileEntityEvents from "../../../src/lib/compiler/compileEntityEvents";
import {
  EVENT_END,
  EVENT_TEXT,
  EVENT_IF_TRUE,
  EVENT_SET_TRUE
} from "../../../src/lib/compiler/eventTypes";

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
  TEXT_WITH_AVATAR: 0x54,
};

test("should precompile empty events", () => {
  const input = [];
  const output = compileEntityEvents(input);
  expect(output).toEqual([CMD_LOOKUP.END]);
});

test("should allow passing in output object", () => {
  const input = [];
  let output = [];
  const newOutput = compileEntityEvents(input, { output });
  expect(output).toBe(newOutput);
});

test("should collapse multiple end events", () => {
  const input = [
    {
      command: EVENT_END
    },
    {
      command: EVENT_END
    }
  ];
  const output = compileEntityEvents(input);
  expect(output).toEqual([CMD_LOOKUP.END]);
});

test("should output text command", () => {
  const input = [
    {
      command: EVENT_TEXT,
      args: {
        text: "HELLO WORLD"
      }
    }
  ];
  const strings = ["HELLO WORLD"];
  const output = compileEntityEvents(input, { strings });
  expect(output).toEqual([CMD_LOOKUP.TEXT, 0, 0, CMD_LOOKUP.END]);
});

test("should output text command string pointers", () => {
  const input = [
    {
      command: EVENT_TEXT,
      args: {
        text: "TEST_10"
      }
    },
    {
      command: EVENT_TEXT,
      args: {
        text: "TEST_260"
      }
    }
  ];
  let strings = [];
  for (let i = 0; i < 300; i++) {
    strings.push("TEST_" + i);
  }
  strings.push("HELLO WORLD");
  const output = compileEntityEvents(input, { strings });
  expect(output).toEqual([
    CMD_LOOKUP.TEXT,
    0,
    10,
    CMD_LOOKUP.TEXT,
    1,
    4,
    CMD_LOOKUP.END
  ]);
});

test("should output text with avatar command", () => {
  const input = [
    {
      command: EVENT_TEXT,
      args: {
        text: "HELLO WORLD",
        avatarId: 2
      }
    }
  ];
  const strings = ["HELLO WORLD"];
  const avatars = [1, 2, 3];
  const output = compileEntityEvents(input, { strings, avatars });
  expect(output).toEqual([CMD_LOOKUP.TEXT_WITH_AVATAR, 0, 0, 0, CMD_LOOKUP.END]);
});


test("should output text wit avatar command string pointers", () => {
  const input = [
    {
      command: EVENT_TEXT,
      args: {
        text: "TEST_10",
        avatarId: 1,
      }
    },
    {
      command: EVENT_TEXT,
      args: {
        text: "TEST_260",
        avatarId: 1,
      }
    }
  ];
  let strings = [];
  for (let i = 0; i < 300; i++) {
    strings.push("TEST_" + i);
  }
  strings.push("HELLO WORLD");
  let avatars = [];
  const output = compileEntityEvents(input, { strings, avatars });
  expect(output).toEqual([
    CMD_LOOKUP.TEXT_WITH_AVATAR,
    0,
    10,
    0,
    CMD_LOOKUP.TEXT_WITH_AVATAR,
    1,
    4,
    0,
    CMD_LOOKUP.END
  ]);
});

test("should allow conditional statements", () => {
  const input = [
    {
      command: EVENT_IF_TRUE,
      args: {
        variable: "4"
      },
      children: {
        true: [
          {
            command: EVENT_TEXT,
            args: {
              text: "TRUE PATH"
            }
          }
        ],
        false: [
          {
            command: EVENT_TEXT,
            args: {
              text: "FALSE PATH"
            }
          }
        ]
      }
    }
  ];
  const strings = ["HELLO WORLD", "TRUE PATH", "FALSE PATH"];
  const variables = ["1", "2", "3", "4"];
  const output = compileEntityEvents(input, { strings, variables });
  expect(output).toEqual([
    CMD_LOOKUP.IF_TRUE, // 0
    0, // 1 Variable ptr hi
    3, // 2 Variable ptr lo
    0, // 3 Jump ptr hi
    11, // 4 Jump ptr lo
    // False path
    CMD_LOOKUP.TEXT, // 5
    0, // 6
    2, // 7
    CMD_LOOKUP.JUMP, // 8
    0, // 9 Jump to end
    14, // 10
    // True path
    CMD_LOOKUP.TEXT, // 11
    0, // 12
    1, // 13
    CMD_LOOKUP.END // 14
  ]);
});

test("should allow commands after conditional", () => {
  const input = [
    {
      command: EVENT_IF_TRUE,
      args: {
        variable: "4"
      },
      children: {
        true: [
          {
            command: EVENT_TEXT,
            args: {
              text: "TRUE PATH"
            }
          }
        ],
        false: [
          {
            command: EVENT_TEXT,
            args: {
              text: "FALSE PATH"
            }
          }
        ]
      }
    },
    {
      command: EVENT_TEXT,
      args: {
        text: "AFTER"
      }
    }
  ];
  const strings = ["HELLO WORLD", "TRUE PATH", "FALSE PATH", "AFTER"];
  const variables = ["1", "2", "3", "4"];
  const output = compileEntityEvents(input, { strings, variables });
  expect(output).toEqual([
    CMD_LOOKUP.IF_TRUE, // 0
    0, // 1 Variable ptr hi
    3, // 2 Variable ptr lo
    0, // 3 Jump ptr hi
    11, // 4 Jump ptr lo
    // False path
    CMD_LOOKUP.TEXT, // 5
    0, // 6
    2, // 7
    CMD_LOOKUP.JUMP, // 8
    0, // 9 Jump to end
    14, // 10
    // True path
    CMD_LOOKUP.TEXT, // 11
    0, // 12
    1, // 13
    CMD_LOOKUP.TEXT, // 14
    0, // 15 After text hi ptr
    3, // 16
    CMD_LOOKUP.END // 17
  ]);
});

test("should add strings to array if not found", () => {
  const input = [
    {
      command: EVENT_TEXT,
      args: {
        text: "HELLO WORLD"
      }
    }
  ];
  const strings = ["LOREM IPSUM"];
  compileEntityEvents(input, { strings });
  expect(strings.length).toBe(2);
});

test("should allow previously undefined variables to be added automatically", () => {
  const input = [
    {
      command: EVENT_SET_TRUE,
      args: {
        variable: "1"
      }
    }
  ];
  const variables = ["2"];
  compileEntityEvents(input, { variables });
  expect(variables.length).toEqual(2);
});
