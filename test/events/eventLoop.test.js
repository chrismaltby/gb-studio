import { compile } from "../../src/lib/events/eventLoop";

test("Should be able to loop events", () => {
  const mockCompileEvents = jest.fn();
  const mockLabelDefine = jest.fn();
  const mockLabelGoto = jest.fn();
  const mockNextFrameAwait = jest.fn();
  const mockEvent = { id: "xyz" };

  const truePath = [{ command: "EVENT_END", id: "abc" }];
  compile(
    { true: truePath },
    {
      labelDefine: mockLabelDefine,
      labelGoto: mockLabelGoto,
      nextFrameAwait: mockNextFrameAwait,
      compileEvents: mockCompileEvents,
      event: mockEvent
    }
  );

  expect(mockLabelDefine).toBeCalledWith("loop_start_xyz");
  expect(mockCompileEvents).toBeCalledWith(truePath);
  expect(mockCompileEvents).toHaveBeenCalledAfter(mockLabelDefine);
  expect(mockNextFrameAwait).toHaveBeenCalledAfter(mockCompileEvents);
  expect(mockLabelGoto).toBeCalledWith("loop_start_xyz");
  expect(mockLabelGoto).toHaveBeenCalledAfter(mockNextFrameAwait);
});
