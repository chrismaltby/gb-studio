import { compile } from "../../src/lib/events/eventTimerDisable";

test("Should be able to disable timer", () => {
  const mockTimerDisable = jest.fn();

  compile(
    {},
    {
      timerDisable: mockTimerDisable,
    },
  );
  expect(mockTimerDisable).toHaveBeenCalledWith(undefined);
});

test("Should be able to disable a numbered timer", () => {
  const mockTimerDisable = jest.fn();

  compile(
    {
      timer: 4,
    },
    {
      timerDisable: mockTimerDisable,
    },
  );
  expect(mockTimerDisable).toHaveBeenCalledWith(4);
});
