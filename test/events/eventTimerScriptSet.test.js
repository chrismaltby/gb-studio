import { compile } from "../../src/lib/events/eventTimerScriptSet";

test("Should be able to set a timer script", () => {
  const mockTimerScriptSet = jest.fn();
  const timeoutScript = [{ command: "EVENT_END", id: "abc" }];

  compile(
    {
      duration: 5.0,
      script: timeoutScript,
    },
    {
      timerScriptSet: mockTimerScriptSet,
      event: {
        symbol: "subscript_symbol",
      },
    }
  );
  expect(mockTimerScriptSet).toBeCalledWith(
    300,
    timeoutScript,
    "subscript_symbol"
  );
});
