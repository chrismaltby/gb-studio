import { ScriptEvent } from "shared/lib/entities/entitiesTypes";
import { walkScript } from "../../src/shared/lib/scripts/walk";

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
