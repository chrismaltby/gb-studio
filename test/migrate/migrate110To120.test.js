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
    }
  });
});

test("should migrate camera speed values from 1.1.0 to 1.2.0", () => {
  const oldEvent0 = {
    id: "abc",
    command: "EVENT_CAMERA_MOVE_TO",
    args: {
      speed: "0"
    }
  };
  const oldEvent1 = {
    id: "abc",
    command: "EVENT_CAMERA_MOVE_TO",
    args: {
      speed: "1"
    }
  };
  const oldEvent2 = {
    id: "abc",
    command: "EVENT_CAMERA_MOVE_TO",
    args: {
      speed: "2"
    }
  };
  const oldEvent3 = {
    id: "abc",
    command: "EVENT_CAMERA_MOVE_TO",
    args: {
      speed: "3"
    }
  };
  const oldEvent4 = {
    id: "abc",
    command: "EVENT_CAMERA_MOVE_TO",
    args: {
      speed: "4"
    }
  };
  const oldEvent5 = {
    id: "abc",
    command: "EVENT_CAMERA_MOVE_TO",
    args: {
      speed: "5"
    }
  };
  expect(migrateFrom110To120Event(oldEvent0)).toEqual({
    id: "abc",
    command: "EVENT_CAMERA_MOVE_TO",
    args: {
      speed: "0"
    }
  });
  expect(migrateFrom110To120Event(oldEvent1)).toEqual({
    id: "abc",
    command: "EVENT_CAMERA_MOVE_TO",
    args: {
      speed: "2"
    }
  });
  expect(migrateFrom110To120Event(oldEvent2)).toEqual({
    id: "abc",
    command: "EVENT_CAMERA_MOVE_TO",
    args: {
      speed: "3"
    }
  });
  expect(migrateFrom110To120Event(oldEvent3)).toEqual({
    id: "abc",
    command: "EVENT_CAMERA_MOVE_TO",
    args: {
      speed: "4"
    }
  });
  expect(migrateFrom110To120Event(oldEvent4)).toEqual({
    id: "abc",
    command: "EVENT_CAMERA_MOVE_TO",
    args: {
      speed: "5"
    }
  });
  expect(migrateFrom110To120Event(oldEvent5)).toEqual({
    id: "abc",
    command: "EVENT_CAMERA_MOVE_TO",
    args: {
      speed: "5"
    }
  });
});
test("should migrate field visbility conditions from 1.1.0 to 1.2.0", () => {
  const oldEvent = {
    showIfKey: "foo",
    showIfValue: "bar"
  };
  expect(migrateFrom110To120Event(oldEvent)).toEqual({
    conditions: [
      {
        key: "foo",
        eq: "bar"
      }
    ]
  });
});
