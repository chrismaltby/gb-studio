import { compile } from "../../src/lib/events/eventWait";

test("Should be able to wait for a second", () => {
  const mockWaitScriptValues = jest.fn();
  compile(
    {
      time: 1,
    },
    {
      waitScriptValue: mockWaitScriptValues,
    },
  );
  expect(mockWaitScriptValues).toBeCalledWith(1, "time");
});

test("Should wait for half a second if time not set", () => {
  const mockWaitScriptValues = jest.fn();
  compile(
    {},
    {
      waitScriptValue: mockWaitScriptValues,
    },
  );
  expect(mockWaitScriptValues).toBeCalledWith(0.5, "time");
});

test("Should be able to wait for one and a half seconds", () => {
  const mockWaitScriptValues = jest.fn();
  compile(
    {
      time: 1.5,
    },
    {
      waitScriptValue: mockWaitScriptValues,
    },
  );
  expect(mockWaitScriptValues).toBeCalledWith(1.5, "time");
});

test("Should be able to wait for one frame", () => {
  const mockWaitScriptValues = jest.fn();
  compile(
    {
      frames: 1,
      units: "frames",
    },
    {
      waitScriptValue: mockWaitScriptValues,
    },
  );
  expect(mockWaitScriptValues).toBeCalledWith(1, "frames");
});
