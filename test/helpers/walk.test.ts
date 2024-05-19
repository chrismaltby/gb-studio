import {
  CustomEvent,
  CustomEventNormalized,
  ScriptEvent,
  ScriptEventNormalized,
} from "shared/lib/entities/entitiesTypes";
import {
  walkNormalizedScript,
  walkScript,
} from "../../src/shared/lib/scripts/walk";

test("shouldn't walk empty events", () => {
  const events: ScriptEvent[] = [];
  const myMock = jest.fn();
  walkScript(events, undefined, myMock);
  expect(myMock.mock.calls.length).toBe(0);
});

test("shouldn't walk undefined events", () => {
  const myMock = jest.fn();
  walkScript(undefined, undefined, myMock);
  expect(myMock.mock.calls.length).toBe(0);
});

test("should walk each node once", () => {
  const events = [
    {
      id: "0",
    },
    {
      id: "1",
    },
  ] as unknown as ScriptEvent[];
  const myMock = jest.fn();
  walkScript(events, undefined, myMock);
  expect(myMock.mock.calls.length).toBe(2);
});

test("should walk each node once", () => {
  const events = [
    {
      id: "0",
    },
    {
      id: "1",
    },
  ] as unknown as ScriptEvent[];
  const myMock = jest.fn();
  walkScript(events, undefined, myMock);
  expect(myMock.mock.calls.length).toBe(2);
});

test("should walk each node in order", () => {
  const events = [
    {
      id: "0",
    },
    {
      id: "1",
    },
  ] as unknown as ScriptEvent[];
  const output: string[] = [];
  const myFn = (node: ScriptEvent) => output.push(node.id);
  walkScript(events, undefined, myFn);
  expect(output).toEqual(["0", "1"]);
});

test("should walk node, then true path, then false path", () => {
  const events = [
    {
      id: "0",
      children: {
        true: [
          {
            id: "1",
          },
          {
            id: "2",
          },
        ],
        false: [
          {
            id: "3",
          },
        ],
      },
    },
    {
      id: "4",
    },
  ] as unknown as ScriptEvent[];
  const output: string[] = [];
  const myFn = (node: ScriptEvent) => output.push(node.id);
  walkScript(events, undefined, myFn);
  expect(output).toEqual(["0", "1", "2", "3", "4"]);
});

test("shouldn't recursively walk through the same custom script multiple times", () => {
  const events = [
    {
      id: "0",
      command: "EVENT_CALL_CUSTOM_EVENT",
      args: {
        customEventId: "s1",
      },
    },
  ] as unknown as ScriptEvent[];
  const customEventsLookup = {
    s1: {
      id: "s1",
      script: [
        {
          id: "1",
        },
        {
          id: "2",
          command: "EVENT_CALL_CUSTOM_EVENT",
          args: {
            customEventId: "s1",
          },
        },
      ],
    },
  } as unknown as Record<string, CustomEvent>;
  const output: string[] = [];
  const myFn = (node: ScriptEvent) => output.push(node.id);
  walkScript(
    events,
    {
      customEvents: {
        lookup: customEventsLookup,
        maxDepth: 5,
      },
    },
    myFn
  );
  expect(output).toEqual(["0", "1", "2"]);
});

test("shouldn't walk through commented events", () => {
  const events = [
    {
      id: "0",
      args: {
        __comment: true,
      },
    },
    {
      id: "1",
    },
    {
      id: "2",
      args: {
        __comment: true,
      },
    },
  ] as unknown as ScriptEvent[];
  const output: string[] = [];
  const myFn = (node: ScriptEvent) => output.push(node.id);
  walkScript(events, undefined, myFn);
  expect(output).toEqual(["1"]);
});

test("shouldn't recursively walk through the same normalized custom script multiple times", () => {
  const eventIds = ["0"];
  const eventsLookup = {
    "0": {
      id: "0",
      command: "EVENT_CALL_CUSTOM_EVENT",
      args: {
        customEventId: "s1",
      },
    },
    "1": {
      id: "1",
    },
    "2": {
      id: "2",
      command: "EVENT_CALL_CUSTOM_EVENT",
      args: {
        customEventId: "s1",
      },
    },
  } as unknown as Record<string, ScriptEventNormalized>;
  const customEventsLookup = {
    s1: {
      id: "s1",
      script: ["1", "2"],
    },
  } as unknown as Record<string, CustomEventNormalized>;
  const output: string[] = [];
  const myFn = (node: ScriptEventNormalized) => output.push(node.id);
  walkNormalizedScript(
    eventIds,
    eventsLookup,
    {
      customEvents: {
        lookup: customEventsLookup,
        maxDepth: 5,
      },
    },
    myFn
  );
  expect(output).toEqual(["0", "1", "2"]);
});

test("shouldn't walk through commented normalized events", () => {
  const eventIds = ["0", "1", "2"];
  const eventsLookup = {
    "0": {
      id: "0",
      args: {
        __comment: true,
      },
    },
    "1": {
      id: "1",
    },
    "2": {
      id: "2",
      args: {
        __comment: true,
      },
    },
  } as unknown as Record<string, ScriptEventNormalized>;
  const output: string[] = [];
  const myFn = (node: ScriptEventNormalized) => output.push(node.id);
  walkNormalizedScript(eventIds, eventsLookup, undefined, myFn);
  expect(output).toEqual(["1"]);
});

test("should walk through commented normalized events if requested", () => {
  const eventIds = ["0", "1", "2"];
  const eventsLookup = {
    "0": {
      id: "0",
      args: {
        __comment: true,
      },
    },
    "1": {
      id: "1",
    },
    "2": {
      id: "2",
      args: {
        __comment: true,
      },
    },
  } as unknown as Record<string, ScriptEventNormalized>;
  const output: string[] = [];
  const myFn = (node: ScriptEventNormalized) => output.push(node.id);
  walkNormalizedScript(
    eventIds,
    eventsLookup,
    {
      includeCommented: true,
    },
    myFn
  );
  expect(output).toEqual(["0", "1", "2"]);
});
