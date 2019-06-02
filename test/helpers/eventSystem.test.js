import { walkEvents, patchEvents } from "../../src/lib/helpers/eventSystem";

test("shouldn't walk empty events", () => {
  const events = [];
  const myMock = jest.fn();
  walkEvents(events, myMock);
  expect(myMock.mock.calls.length).toBe(0);
});

test("shouldn't walk undefined events", () => {
  const myMock = jest.fn();
  walkEvents(undefined, myMock);
  expect(myMock.mock.calls.length).toBe(0);
});

test("should walk each node once", () => {
  const events = [
    {
      id: 0
    },
    {
      id: 1
    }
  ];
  const myMock = jest.fn();
  walkEvents(events, myMock);
  expect(myMock.mock.calls.length).toBe(2);
});

test("should walk each node once", () => {
  const events = [
    {
      id: 0
    },
    {
      id: 1
    }
  ];
  const myMock = jest.fn();
  walkEvents(events, myMock);
  expect(myMock.mock.calls.length).toBe(2);
});

test("should walk each node in order", () => {
  const events = [
    {
      id: 0
    },
    {
      id: 1
    }
  ];
  let output = [];
  const myFn = node => output.push(node.id);
  walkEvents(events, myFn);
  expect(output).toEqual([0, 1]);
});

test("should walk node, then true path, then false path", () => {
  const events = [
    {
      id: 0,
      children: {
        true: [
          {
            id: 1
          },
          {
            id: 2
          }
        ],
        false: [
          {
            id: 3
          }
        ]
      }
    },
    {
      id: 4
    }
  ];
  let output = [];
  const myFn = node => output.push(node.id);
  walkEvents(events, myFn);
  expect(output).toEqual([0, 1, 2, 3, 4]);
});

test("should patch events", () => {
  const events = [
    {
      id: 0,
      args: {
        data: "hello"
      }
    }
  ];
  const newEvents = patchEvents(events, 0, { data: "world" });
  expect(events[0].args.data).toBe("hello");
  expect(newEvents[0].args.data).toBe("world");
});

test("should patch events following tree", () => {
  const events = [
    {
      id: 0,
      children: {
        true: [
          {
            id: 1,
            args: {
              data: "true path"
            }
          }
        ],
        false: [
          {
            id: 2,
            args: {
              data: "false path"
            }
          }
        ]
      }
    }
  ];
  const newEvents = patchEvents(events, 1, { data: "true path updated" });
  const newEvents2 = patchEvents(newEvents, 2, { data: "false path updated" });

  expect(events[0].children.true[0].args.data).toBe("true path");
  expect(events[0].children.false[0].args.data).toBe("false path");
  expect(newEvents2[0].children.true[0].args.data).toBe("true path updated");
  expect(newEvents2[0].children.false[0].args.data).toBe("false path updated");
});
