import { compile } from "../../src/lib/events/eventDataSave";

test("Should be able to save data", () => {
  const mockDataSave = jest.fn();
  compile(
    {},
    {
      dataSave: mockDataSave
    }
  );
  expect(mockDataSave).toBeCalled();
});
