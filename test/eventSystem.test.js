import { walkEvents, patchEvents } from "../src/lib/helpers/eventSystem";

test("shouldn't walk empty events", () => {
  const events = [];
  const myMock = jest.fn();
  walkEvents(events, myMock);
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
