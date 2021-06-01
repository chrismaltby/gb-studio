import { compile } from "../../src/lib/events/eventLoop";

test("Should be able to loop events", () => {
  const mockCompileEvents = jest.fn();
  const mockLabelDefine = jest.fn();
  const mockLabelGoto = jest.fn();
  const mockGetNextLabel = jest.fn().mockReturnValueOnce("loop_start_xyz");
  const mockEvent = { id: "xyz" };

  const truePath = [{ command: "EVENT_END", id: "abc" }];
  compile(
    { true: truePath },
    {
      labelDefine: mockLabelDefine,
      labelGoto: mockLabelGoto,
      compileEvents: mockCompileEvents,
      getNextLabel: mockGetNextLabel,
      event: mockEvent,
    }
  );

  expect(mockGetNextLabel).toBeCalled();
  expect(mockLabelDefine).toBeCalledWith("loop_start_xyz");
  expect(mockCompileEvents).toBeCalledWith(truePath);
  expect(mockCompileEvents).toHaveBeenCalledAfter(mockLabelDefine);
  expect(mockLabelGoto).toBeCalledWith("loop_start_xyz");
});
