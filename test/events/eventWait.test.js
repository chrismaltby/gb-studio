import { compile } from "../../src/lib/events/eventWait";

test("Should be able to wait for a second", () => {
  const mockWait = jest.fn();
  compile(
    {
      time: 1,
    },
    {
      wait: mockWait,
    }
  );
  expect(mockWait).toBeCalledWith(60);
});

test("Should wait for half a second if time not set", () => {
  const mockWait = jest.fn();
  compile(
    {},
    {
      wait: mockWait,
    }
  );
  expect(mockWait).toBeCalledWith(30);
});

test("Should be able to wait for one and a half seconds", () => {
  const mockWait = jest.fn();
  compile(
    {
      time: 1.5,
    },
    {
      wait: mockWait,
    }
  );
  expect(mockWait).toBeCalledWith(90);
});
