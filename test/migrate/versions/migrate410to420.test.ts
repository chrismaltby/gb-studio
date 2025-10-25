import cloneDeep from "lodash/cloneDeep";
import {
  migrateFrom410r1To420r1Event,
  migrateFrom420r1To420r2Event,
  migrateFrom420r2To420r3EngineFields,
  migrateFrom420r2To420r3Event,
  migrateFrom420r3To420r4Event,
  migrateFrom420r3To420r4Sprites,
  migrateFrom420r4To420r5Event,
} from "lib/project/migration/versions/410to420";
import {
  EngineFieldValue,
  ScriptEvent,
} from "shared/lib/entities/entitiesTypes";
import {
  CompressedProjectResources,
  SpriteResource,
} from "shared/lib/resources/types";
import {
  dummyCompressedProjectResources,
  dummySpriteResource,
} from "../../dummydata";

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

  test("Should convert EVENT_WAIT both frames and time fields to const values", () => {
    const input: ScriptEvent = {
      id: "event1",
      command: "EVENT_WAIT",
      args: {
        units: "frames",
        time: 10.4,
        frames: 12,
      },
    };
    const output = migrateFrom420r1To420r2Event(input);
    expect(output.id).toEqual(input.id);
    expect(output.args?.frames).toEqual({
      type: "number",
      value: 12,
    });
    expect(output.args?.time).toEqual({
      type: "number",
      value: 10.4,
    });
    expect(output.args?.units).toEqual("frames");
  });

  test("Should convert EVENT_WAIT using default values if missing", () => {
    const input: ScriptEvent = {
      id: "event1",
      command: "EVENT_WAIT",
      args: {
        units: "frames",
      },
    };
    const output = migrateFrom420r1To420r2Event(input);
    expect(output.id).toEqual(input.id);
    expect(output.args?.frames).toEqual({
      type: "number",
      value: 30,
    });
    expect(output.args?.time).toEqual({
      type: "number",
      value: 0.5,
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

  test("Should not modify non-wait events", () => {
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

describe("migrateFrom420r2To420r3Event", () => {
  test("should migrate EVENT_ACTOR_MOVE_TO event", () => {
    const oldEvent: ScriptEvent = {
      id: "event1",
      command: "EVENT_ACTOR_MOVE_TO",
      args: {
        actorId: "actor123",
        x: { type: "number", value: 10 },
        y: { type: "number", value: 20 },
        useCollisions: true,
        moveType: "horizontal",
        units: "tiles",
      },
    };
    expect(migrateFrom420r2To420r3Event(oldEvent)).toMatchObject({
      command: "EVENT_ACTOR_MOVE_TO",
      args: {
        actorId: "actor123",
        x: { type: "number", value: 10 },
        y: { type: "number", value: 20 },
        collideWith: ["walls", "actors"],
        moveType: "horizontal",
        units: "tiles",
      },
    });
  });
  test("should migrate EVENT_ACTOR_MOVE_TO event with false collisions to empty collideWith", () => {
    const oldEvent: ScriptEvent = {
      id: "event1",
      command: "EVENT_ACTOR_MOVE_TO",
      args: {
        actorId: "actor123",
        x: { type: "number", value: 10 },
        y: { type: "number", value: 20 },
        useCollisions: false,
        moveType: "horizontal",
        units: "tiles",
      },
    };
    expect(migrateFrom420r2To420r3Event(oldEvent)).toMatchObject({
      command: "EVENT_ACTOR_MOVE_TO",
      args: {
        actorId: "actor123",
        x: { type: "number", value: 10 },
        y: { type: "number", value: 20 },
        collideWith: [],
        moveType: "horizontal",
        units: "tiles",
      },
    });
  });
  test("should migrate EVENT_ACTOR_MOVE_TO event with missing collisions to empty collideWith", () => {
    const oldEvent: ScriptEvent = {
      id: "event1",
      command: "EVENT_ACTOR_MOVE_TO",
      args: {
        actorId: "actor123",
        x: { type: "number", value: 10 },
        y: { type: "number", value: 20 },
        moveType: "horizontal",
        units: "tiles",
      },
    };
    expect(migrateFrom420r2To420r3Event(oldEvent)).toMatchObject({
      command: "EVENT_ACTOR_MOVE_TO",
      args: {
        actorId: "actor123",
        x: { type: "number", value: 10 },
        y: { type: "number", value: 20 },
        collideWith: [],
        moveType: "horizontal",
        units: "tiles",
      },
    });
  });
  test("should migrate EVENT_ACTOR_MOVE_RELATIVE event", () => {
    const oldEvent: ScriptEvent = {
      id: "event1",
      command: "EVENT_ACTOR_MOVE_RELATIVE",
      args: {
        actorId: "actor123",
        x: { type: "number", value: 10 },
        y: { type: "number", value: 20 },
        useCollisions: true,
        moveType: "horizontal",
        units: "tiles",
      },
    };
    expect(migrateFrom420r2To420r3Event(oldEvent)).toMatchObject({
      command: "EVENT_ACTOR_MOVE_RELATIVE",
      args: {
        actorId: "actor123",
        x: { type: "number", value: 10 },
        y: { type: "number", value: 20 },
        collideWith: ["walls", "actors"],
        moveType: "horizontal",
        units: "tiles",
      },
    });
  });
});

describe("migrateFrom420r2To420r3EngineFields", () => {
  const getFieldValue = (
    values: { engineFieldValues: EngineFieldValue[] },
    id: string,
  ) => {
    return (
      values.engineFieldValues.find(
        (field: EngineFieldValue) => field.id === id,
      )?.value || null
    );
  };

  test("should double the shooter_scroll_speed value", () => {
    const resources: CompressedProjectResources = {
      ...dummyCompressedProjectResources,
      engineFieldValues: {
        ...dummyCompressedProjectResources.engineFieldValues,
        engineFieldValues: [
          { id: "shooter_scroll_speed", value: 5 },
          { id: "other_field", value: 10 },
        ],
      },
    };
    const migrated = migrateFrom420r2To420r3EngineFields(resources);
    expect(
      getFieldValue(migrated.engineFieldValues, "shooter_scroll_speed"),
    ).toEqual(10);
  });

  test("should not modify other engine fields", () => {
    const resources: CompressedProjectResources = {
      ...dummyCompressedProjectResources,
      engineFieldValues: {
        ...dummyCompressedProjectResources.engineFieldValues,
        engineFieldValues: [{ id: "other_field", value: 10 }],
      },
    };
    const migrated = migrateFrom420r2To420r3EngineFields(resources);
    expect(getFieldValue(migrated.engineFieldValues, "other_field")).toEqual(
      10,
    );
  });

  test("should set new enabled flag defaults to false matching previous default behaviour", () => {
    const resources: CompressedProjectResources = {
      ...dummyCompressedProjectResources,
      engineFieldValues: {
        ...dummyCompressedProjectResources.engineFieldValues,
        engineFieldValues: [],
      },
    };
    const migrated = migrateFrom420r2To420r3EngineFields(resources);
    expect(migrated.engineFieldValues.engineFieldValues).toEqual([
      {
        id: "FEAT_PLATFORM_COYOTE_TIME",
        value: 0,
      },
      {
        id: "FEAT_PLATFORM_DROP_THROUGH",
        value: 0,
      },
    ]);
  });

  test("should not set flag defaults to false when value is already set", () => {
    const resources: CompressedProjectResources = {
      ...dummyCompressedProjectResources,
      engineFieldValues: {
        ...dummyCompressedProjectResources.engineFieldValues,
        engineFieldValues: [
          {
            id: "FEAT_PLATFORM_COYOTE_TIME",
            value: 1,
          },
        ],
      },
    };
    const migrated = migrateFrom420r2To420r3EngineFields(resources);
    expect(migrated.engineFieldValues.engineFieldValues).toEqual([
      {
        id: "FEAT_PLATFORM_COYOTE_TIME",
        value: 1,
      },
      {
        id: "FEAT_PLATFORM_DROP_THROUGH",
        value: 0,
      },
    ]);
  });
});

describe("migrateFrom420r3To420r4Sprites", () => {
  test("should migrate sprite bounds when bounds at previous origin", () => {
    const oldSprite: SpriteResource = {
      ...dummySpriteResource,
      boundsX: 0,
      boundsY: 0,
      boundsWidth: 16,
      boundsHeight: 16,
    };

    const oldProject: CompressedProjectResources = {
      ...dummyCompressedProjectResources,
      sprites: [oldSprite],
    };

    expect(migrateFrom420r3To420r4Sprites(oldProject).sprites[0]).toMatchObject(
      {
        ...oldSprite,
        boundsY: -8,
      },
    );
  });

  test("should migrate sprite bounds when bounds offset from previous origin", () => {
    const oldSprite: SpriteResource = {
      ...dummySpriteResource,
      boundsX: 8,
      boundsY: 8,
      boundsWidth: 8,
      boundsHeight: 24,
    };

    const oldProject: CompressedProjectResources = {
      ...dummyCompressedProjectResources,
      sprites: [oldSprite],
    };

    expect(migrateFrom420r3To420r4Sprites(oldProject).sprites[0]).toMatchObject(
      {
        ...oldSprite,
        boundsY: -24,
      },
    );
  });
});

describe("migrateFrom420r3To420r4Event", () => {
  test("should migrate EVENT_ACTOR_SET_COLLISION_BOX event when bounds at previous origin", () => {
    const oldEvent: ScriptEvent = {
      id: "event1",
      command: "EVENT_ACTOR_SET_COLLISION_BOX",
      args: {
        actorId: "actor123",
        x: 0,
        y: 0,
        width: 16,
        height: 16,
      },
    };
    expect(migrateFrom420r3To420r4Event(oldEvent)).toMatchObject({
      command: "EVENT_ACTOR_SET_COLLISION_BOX",
      args: {
        actorId: "actor123",
        x: 0,
        y: -8,
        width: 16,
        height: 16,
      },
    });
  });

  test("should migrate EVENT_ACTOR_SET_COLLISION_BOX event when bounds offset from previous origin", () => {
    const oldEvent: ScriptEvent = {
      id: "event1",
      command: "EVENT_ACTOR_SET_COLLISION_BOX",
      args: {
        actorId: "actor123",
        x: 8,
        y: 8,
        width: 8,
        height: 24,
      },
    };
    expect(migrateFrom420r3To420r4Event(oldEvent)).toMatchObject({
      command: "EVENT_ACTOR_SET_COLLISION_BOX",
      args: {
        actorId: "actor123",
        x: 8,
        y: -24,
        width: 8,
        height: 24,
      },
    });
  });
});

describe("migrateFrom420r4To420r4Event", () => {
  test("should migrate EVENT_DIALOGUE_CLOSE_NONMODAL event speed", () => {
    const oldEvent: ScriptEvent = {
      id: "event1",
      command: "EVENT_DIALOGUE_CLOSE_NONMODAL",
      args: {
        speed: 3,
      },
    };
    expect(migrateFrom420r4To420r5Event(oldEvent)).toMatchObject({
      command: "EVENT_DIALOGUE_CLOSE_NONMODAL",
      args: {
        speed: 4,
      },
    });
  });
  test("should migrate EVENT_OVERLAY_MOVE_TO event speed", () => {
    const oldEvent: ScriptEvent = {
      id: "event1",
      command: "EVENT_OVERLAY_MOVE_TO",
      args: {
        x: 5,
        y: 9,
        speed: 3,
      },
    };
    expect(migrateFrom420r4To420r5Event(oldEvent)).toMatchObject({
      command: "EVENT_OVERLAY_MOVE_TO",
      args: {
        x: 5,
        y: 9,
        speed: 4,
      },
    });
  });
  test("should not migrate EVENT_DIALOGUE_CLOSE_NONMODAL event speed if 0", () => {
    const oldEvent: ScriptEvent = {
      id: "event1",
      command: "EVENT_DIALOGUE_CLOSE_NONMODAL",
      args: {
        speed: 0,
      },
    };
    expect(migrateFrom420r4To420r5Event(oldEvent)).toMatchObject({
      command: "EVENT_DIALOGUE_CLOSE_NONMODAL",
      args: {
        speed: 0,
      },
    });
  });
  test("should not migrate EVENT_OVERLAY_MOVE_TO event speed if 0", () => {
    const oldEvent: ScriptEvent = {
      id: "event1",
      command: "EVENT_OVERLAY_MOVE_TO",
      args: {
        x: 5,
        y: 9,
        speed: 0,
      },
    };
    expect(migrateFrom420r4To420r5Event(oldEvent)).toMatchObject({
      command: "EVENT_OVERLAY_MOVE_TO",
      args: {
        x: 5,
        y: 9,
        speed: 0,
      },
    });
  });
});
