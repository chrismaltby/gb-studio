import precompileEntityEvents, {
  CMD_LOOKUP,
  STRING_NOT_FOUND,
  FLAG_NOT_FOUND
} from "../../../src/lib/data/compiler/precompileEntityEvents";
import {
  EVENT_END,
  EVENT_TEXT,
  EVENT_IF_FLAG,
  EVENT_SET_FLAG
} from "../../../src/lib/data/compiler/eventTypes";

test("should precompile empty events", () => {
  const input = [];
  const output = precompileEntityEvents(input);
  expect(output).toEqual([CMD_LOOKUP.END]);
});

test("should allow passing in output object", () => {
  const input = [];
  let output = [];
  const newOutput = precompileEntityEvents(input, { output });
  expect(output).toBe(newOutput);
});

test("should NOT collapse multiple end events", () => {
  const input = [
    {
      command: EVENT_END
    }
  ];
  const output = precompileEntityEvents(input);
  expect(output).toEqual([CMD_LOOKUP.END, CMD_LOOKUP.END]);
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
  const output = precompileEntityEvents(input, { strings });
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
  const output = precompileEntityEvents(input, { strings });
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

test("should allow conditional statements", () => {
  const input = [
    {
      command: EVENT_IF_FLAG,
      args: {
        flag: "4"
      },
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
  ];
  const strings = ["HELLO WORLD", "TRUE PATH", "FALSE PATH"];
  const flags = ["1", "2", "3", "4"];
  const output = precompileEntityEvents(input, { strings, flags });
  expect(output).toEqual([
    CMD_LOOKUP.IF_FLAG, // 0
    0, // 1 Flag ptr hi
    3, // 2 Flag ptr lo
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

test.todo("should allow commands before conditional");

test("should allow commands after conditional", () => {
  const input = [
    {
      command: EVENT_IF_FLAG,
      args: {
        flag: "4"
      },
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
    },
    {
      command: EVENT_TEXT,
      args: {
        text: "AFTER"
      }
    }
  ];
  const strings = ["HELLO WORLD", "TRUE PATH", "FALSE PATH", "AFTER"];
  const flags = ["1", "2", "3", "4"];
  const output = precompileEntityEvents(input, { strings, flags });
  expect(output).toEqual([
    CMD_LOOKUP.IF_FLAG, // 0
    0, // 1 Flag ptr hi
    3, // 2 Flag ptr lo
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

test.todo("should allow nested conditionals");

test("should allow ending early", () => {
  const input = [
    {
      command: EVENT_IF_FLAG,
      args: {
        flag: "4"
      },
      true: [
        {
          command: EVENT_TEXT,
          args: {
            text: "TRUE PATH"
          }
        },
        {
          command: EVENT_END
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
    },
    {
      command: EVENT_TEXT,
      args: {
        text: "AFTER"
      }
    }
  ];
  const strings = ["HELLO WORLD", "TRUE PATH", "FALSE PATH", "AFTER"];
  const flags = ["1", "2", "3", "4"];
  const output = precompileEntityEvents(input, { strings, flags });
  expect(output).toEqual([
    CMD_LOOKUP.IF_FLAG, // 0
    0, // 1 Flag ptr hi
    3, // 2 Flag ptr lo
    0, // 3 Jump ptr hi
    11, // 4 Jump ptr lo
    // False path
    CMD_LOOKUP.TEXT, // 5
    0, // 6
    2, // 7
    CMD_LOOKUP.JUMP, // 8
    0, // 9 Jump to end
    15, // 10
    // True path
    CMD_LOOKUP.TEXT, // 11
    0, // 12
    1, // 13
    CMD_LOOKUP.END, // 14
    CMD_LOOKUP.TEXT, // 15
    0, // 16 After text hi ptr
    3, // 17
    CMD_LOOKUP.END // 18
  ]);
});

test("should error if any string lookups return negative values", () => {
  const input = [
    {
      command: EVENT_TEXT,
      args: {
        text: "HELLO WORLD"
      }
    }
  ];
  const strings = ["LOREM IPSUM"];
  expect(() => precompileEntityEvents(input, { strings })).toThrow(
    STRING_NOT_FOUND
  );
});

test("should error if any flag lookups return negative values", () => {
  const input = [
    {
      command: EVENT_SET_FLAG,
      args: {
        text: "1"
      }
    }
  ];
  const flags = ["2"];
  expect(() => precompileEntityEvents(input, { flags })).toThrow(
    FLAG_NOT_FOUND
  );
});

test("should allow ptr values to be offset", () => {
  const input = [
    {
      command: EVENT_IF_FLAG,
      args: {
        flag: "1"
      },
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
  ];
  const strings = ["HELLO WORLD", "TRUE PATH", "FALSE PATH"];
  const flags = ["1"];
  const ptrOffset = 257;
  const output = precompileEntityEvents(input, { strings, flags, ptrOffset });
  expect(output).toEqual([
    CMD_LOOKUP.IF_FLAG, // 0
    0, // 1 Flag ptr hi
    0, // 2 Flag ptr lo
    1, // 3 Jump ptr hi
    12, // 4 Jump ptr lo
    // False path
    CMD_LOOKUP.TEXT, // 5
    0, // 6
    2, // 7
    CMD_LOOKUP.JUMP, // 8
    1, // 9 Jump to end
    15, // 10
    // True path
    CMD_LOOKUP.TEXT, // 11
    0, // 12
    1, // 13
    CMD_LOOKUP.END // 14
  ]);
});
