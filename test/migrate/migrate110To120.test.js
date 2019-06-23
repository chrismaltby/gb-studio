import { migrateFrom110To120Event } from "../../src/lib/project/migrateProject";

test("should migrate math add events from 1.1.0 to 1.2.0", () => {
  const oldEvent = {
    id: "abc",
    command: "EVENT_MATH_ADD",
    args: {
      variable: "3",
      value: 5
    }
  };
  const newEvent = migrateFrom110To120Event(oldEvent);
  expect(newEvent).toEqual({
    id: "abc",
    command: "EVENT_VARIABLE_MATH",
    args: {
      vectorX: "3",
      operation: "add",
      other: "val",
      vectorY: "3",
      value: 5,
      minValue: 0,
      maxValue: 255
    }
  });
});

test("should migrate math mul variable events from 1.1.0 to 1.2.0", () => {
  const oldEvent = {
    id: "def",
    command: "EVENT_MATH_MUL_VALUE",
    args: {
      vectorX: "3",
      vectorY: "5"
    }
  };
  const newEvent = migrateFrom110To120Event(oldEvent);
  expect(newEvent).toEqual({
    id: "def",
    command: "EVENT_VARIABLE_MATH",
    args: {
      vectorX: "3",
      operation: "mul",
      other: "var",
      vectorY: "5",
      value: 0,
      minValue: 0,
      maxValue: 255
    }
  });
});

test("should migrate random value events from 1.1.0 to 1.2.0", () => {
  const oldEvent = {
    id: "xyz",
    command: "EVENT_SET_RANDOM_VALUE",
    args: {
      variable: "2",
      maxValue: 155
    }
  };
  const newEvent = migrateFrom110To120Event(oldEvent);
  expect(newEvent).toEqual({
    id: "xyz",
    command: "EVENT_VARIABLE_MATH",
    args: {
      vectorX: "2",
      operation: "set",
      other: "rnd",
      vectorY: "2",
      value: 0,
      minValue: 0,
      maxValue: 155
    }
  });
});

test("should migrate copy variable events from 1.1.0 to 1.2.0", () => {
  const oldEvent = {
    id: "qwe",
    command: "EVENT_COPY_VALUE",
    args: {
      vectorX: "7",
      vectorY: "6"
    }
  };
  const newEvent = migrateFrom110To120Event(oldEvent);
  expect(newEvent).toEqual({
    id: "qwe",
    command: "EVENT_VARIABLE_MATH",
    args: {
      vectorX: "7",
      operation: "set",
      other: "var",
      vectorY: "6",
      value: 0,
      minValue: 0,
      maxValue: 255
    }
  });
});

test("should migrate conditional events from 1.1.0 to 1.2.0", () => {
  const oldEvent = {
    id: "abc",
    command: "EVENT_IF_TRUE",
    args: {
      variable: "8"
    },
    true: [
      {
        id: "def",
        command: "EVENT_TEXT",
        args: {
          text: "Hello"
        }
      }
    ],
    false: [
      {
        id: "xyz",
        command: "EVENT_TEXT",
        args: {
          text: "World"
        }
      }
    ]
  };
  const newEvent = migrateFrom110To120Event(oldEvent);
  expect(newEvent).toEqual({
    id: "abc",
    command: "EVENT_IF_TRUE",
    args: {
      variable: "8"
    },
    children: {
      true: [
        {
          id: "def",
          command: "EVENT_TEXT",
          args: {
            text: "Hello"
          }
        }
      ],
      false: [
        {
          id: "xyz",
          command: "EVENT_TEXT",
          args: {
            text: "World"
          }
        }
      ]
    },
    // Keep old true/false paths to allow project to still be opened in 1.1.0
    true: [
      {
        id: "def",
        command: "EVENT_TEXT",
        args: {
          text: "Hello"
        }
      }
    ],
    false: [
      {
        id: "xyz",
        command: "EVENT_TEXT",
        args: {
          text: "World"
        }
      }
    ]
  });
});
