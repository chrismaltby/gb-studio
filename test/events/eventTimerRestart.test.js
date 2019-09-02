import { compile } from "../../src/lib/events/eventTimerRestart";

test("Should be able to disable timer", () => {
  const mockTimerRestart = jest.fn();

  compile(
    {},
    {
      timerRestart: mockTimerRestart
    }
  );
  expect(mockTimerRestart).toBeCalledWith();
});
