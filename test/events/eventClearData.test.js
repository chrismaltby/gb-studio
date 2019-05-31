import { compile } from "../../src/lib/events/eventClearData";

test("Should be able to clear saved data", () => {
  const mockClearData = jest.fn();
  compile(
    {},
    {
      clearData: mockClearData
    }
  );
  expect(mockClearData).toBeCalled();
});
