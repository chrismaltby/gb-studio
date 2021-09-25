import { compile } from "../../src/lib/events/eventDataClear";

test("Should be able to clear saved data", () => {
  const mockDataClear = jest.fn();
  compile(
    {
      saveSlot: 1,
    },
    {
      dataClear: mockDataClear
    }
  );
  expect(mockDataClear).toBeCalledWith(1);
});
