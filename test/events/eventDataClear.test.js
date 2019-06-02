import { compile } from "../../src/lib/events/eventDataClear";

test("Should be able to clear saved data", () => {
  const mockDataClear = jest.fn();
  compile(
    {},
    {
      dataClear: mockDataClear
    }
  );
  expect(mockDataClear).toBeCalled();
});
