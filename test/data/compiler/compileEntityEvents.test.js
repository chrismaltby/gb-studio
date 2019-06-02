import compileEntityEvents, {
  CMD_LOOKUP,
  STRING_NOT_FOUND,
  VARIABLE_NOT_FOUND
} from "../../../src/lib/compiler/compileEntityEvents";
import {
  EVENT_END,
  EVENT_TEXT,
  EVENT_IF_TRUE,
  EVENT_SET_TRUE
} from "../../../src/lib/compiler/eventTypes";

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

test("should error if any variable lookups return negative values", () => {
  const input = [
    {
      command: EVENT_SET_TRUE,
      args: {
        variable: "1"
      }
    }
  ];
  const variables = ["2"];
  expect(() => compileEntityEvents(input, { variables })).toThrow(
    VARIABLE_NOT_FOUND
  );
});
