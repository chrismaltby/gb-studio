import { migrateFrom400r1To400r2Event } from "../../src/lib/project/migrateProject";
import initElectronL10N from "../../src/lib/lang/initElectronL10N";

beforeAll(async () => {
  await initElectronL10N();
});

test("should migrate 3.3.0 and below Engine Field Update slider values", () => {
  const oldEvent = {
    command: "EVENT_ENGINE_FIELD_SET",
    args: {
      engineFieldKey: "plat_walk_vel",
      value: {
        type: "slider",
        value: 794,
      },
    },
  };
  expect(migrateFrom400r1To400r2Event(oldEvent)).toMatchObject({
    command: "EVENT_ENGINE_FIELD_SET",
    args: {
      engineFieldKey: "plat_walk_vel",
      value: {
        type: "number",
        value: 794,
      },
    },
  });
});

test("should migrate 3.3.0 and below Engine Field Update select values", () => {
  const oldEvent = {
    command: "EVENT_ENGINE_FIELD_SET",
    args: {
      engineFieldKey: "topdown_grid",
      value: {
        type: "select",
        value: 16,
      },
    },
  };
  expect(migrateFrom400r1To400r2Event(oldEvent)).toMatchObject({
    command: "EVENT_ENGINE_FIELD_SET",
    args: {
      engineFieldKey: "topdown_grid",
      value: {
        type: "number",
        value: 16,
      },
    },
  });
});

test("should keep 3.3.0 and below Engine Field Update variable values unchanged", () => {
  const oldEvent = {
    command: "EVENT_ENGINE_FIELD_SET",
    args: {
      engineFieldKey: "fade_style",
      value: {
        type: "variable",
        value: "L0",
      },
    },
  };
  expect(migrateFrom400r1To400r2Event(oldEvent)).toMatchObject({
    command: "EVENT_ENGINE_FIELD_SET",
    args: {
      engineFieldKey: "fade_style",
      value: {
        type: "variable",
        value: "L0",
      },
    },
  });
});

test("shouldn't add value to 3.3.0 and below Engine Field Update variable values that have empty values", () => {
  const oldEvent = {
    command: "EVENT_ENGINE_FIELD_SET",
    args: {
      engineFieldKey: "plat_walk_vel",
    },
  };
  expect(migrateFrom400r1To400r2Event(oldEvent)).toMatchObject({
    command: "EVENT_ENGINE_FIELD_SET",
    args: {
      engineFieldKey: "plat_walk_vel",
    },
  });
  expect(migrateFrom400r1To400r2Event(oldEvent).args.value).toBeUndefined();
});

test("should keep 3.3.0 and below Engine Field Update variable values that have invalid values", () => {
  const oldEvent = {
    command: "EVENT_ENGINE_FIELD_SET",
    args: {
      engineFieldKey: "plat_walk_vel",
      value: {
        type: "slider",
        value: "",
      },
    },
  };
  expect(migrateFrom400r1To400r2Event(oldEvent)).toMatchObject({
    command: "EVENT_ENGINE_FIELD_SET",
    args: {
      engineFieldKey: "plat_walk_vel",
      value: {
        type: "slider",
        value: "",
      },
    },
  });
});

test("should keep Engine Field Update script values", () => {
  const oldEvent = {
    command: "EVENT_ENGINE_FIELD_SET",
    args: {
      engineFieldKey: "plat_walk_vel",
      value: {
        type: "add",
        valueA: {
          type: "number",
          value: 1792,
        },
        valueB: {
          type: "number",
          value: 55,
        },
      },
    },
  };
  expect(migrateFrom400r1To400r2Event(oldEvent)).toMatchObject({
    command: "EVENT_ENGINE_FIELD_SET",
    args: {
      engineFieldKey: "plat_walk_vel",
      value: {
        type: "add",
        valueA: {
          type: "number",
          value: 1792,
        },
        valueB: {
          type: "number",
          value: 55,
        },
      },
    },
  });
});
