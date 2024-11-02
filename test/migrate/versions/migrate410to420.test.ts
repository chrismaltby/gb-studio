import cloneDeep from "lodash/cloneDeep";
import {
  migrateFrom410r1To420r1Event,
  migrateFrom420r1To420r2Event,
} from "lib/project/migration/versions/410to420";
import { ScriptEvent } from "shared/lib/entities/entitiesTypes";

describe("migrateFrom410r1To420r1Event", () => {
  test("Should convert EVENT_SWITCH values to const values", () => {
    const input: ScriptEvent = {
      id: "event1",
      command: "EVENT_SWITCH",
      args: {
        value1: 1,
        value2: 10,
        value3: 100,
      },
    };
    const output = migrateFrom410r1To420r1Event(input);
    expect(output.id).toEqual(input.id);
    expect(output.args?.value1).toEqual({
      type: "number",
      value: 1,
    });
    expect(output.args?.value2).toEqual({
      type: "number",
      value: 10,
    });
    expect(output.args?.value3).toEqual({
      type: "number",
      value: 100,
    });
    expect(output.args?.value4).toEqual({
      type: "number",
      value: 5,
    });
    expect(output.args?.value15).toEqual({
      type: "number",
      value: 16,
    });
    expect(output.args?.value16).toBeUndefined();
  });

  test("Should not mutate input", () => {
    const input: ScriptEvent = {
      id: "event1",
      command: "EVENT_SWITCH",
      args: {
        value1: 1,
        value2: 10,
        value3: 100,
      },
    };
    const inputClone = cloneDeep(input);
    migrateFrom410r1To420r1Event(input);
    expect(input).toEqual(inputClone);
  });

  test("Should not modify non-switch events", () => {
    const input: ScriptEvent = {
      id: "event1",
      command: "EVENT_FOO",
      args: {
        value1: 1,
        value2: 10,
        value3: 100,
      },
    };
    const output = migrateFrom410r1To420r1Event(input);
    expect(output).toEqual(input);
  });
});

describe("migrateFrom420r1To420r2Event", () => {
  test("Should convert EVENT_WAIT seconds to const values", () => {
    const input: ScriptEvent = {
      id: "event1",
      command: "EVENT_WAIT",
      args: {
        units: "time",
        time: 10.4,
      },
    };
    const output = migrateFrom420r1To420r2Event(input);
    expect(output.id).toEqual(input.id);
    expect(output.args?.time).toEqual({
      type: "number",
      value: 10.4,
    });
    expect(output.args?.units).toEqual("time");
  });

  test("Should convert EVENT_WAIT frames to const values", () => {
    const input: ScriptEvent = {
      id: "event1",
      command: "EVENT_WAIT",
      args: {
        units: "frames",
        frames: 12,
      },
    };
    const output = migrateFrom420r1To420r2Event(input);
    expect(output.id).toEqual(input.id);
    expect(output.args?.frames).toEqual({
      type: "number",
      value: 12,
    });
    expect(output.args?.units).toEqual("frames");
  });

  test("Should not mutate input", () => {
    const input: ScriptEvent = {
      id: "event1",
      command: "EVENT_WAIT",
      args: {
        units: "frames",
        frames: 12,
      },
    };
    const inputClone = cloneDeep(input);
    migrateFrom420r1To420r2Event(input);
    expect(input).toEqual(inputClone);
  });

  test("Should not modify non-switch events", () => {
    const input: ScriptEvent = {
      id: "event1",
      command: "EVENT_FOO",
      args: {
        value1: 1,
        value2: 10,
        value3: 100,
      },
    };
    const output = migrateFrom420r1To420r2Event(input);
    expect(output).toEqual(input);
  });
});
