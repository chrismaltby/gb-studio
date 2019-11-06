import { compile } from "../../src/lib/events/eventTimerDisable";

test("Should be able to disable timer", () => {
  const mockTimerDisable = jest.fn();

  compile(
    {},
    {
      timerDisable: mockTimerDisable
    }
  );
  expect(mockTimerDisable).toBeCalledWith();
});
