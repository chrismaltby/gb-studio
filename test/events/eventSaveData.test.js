import { compile } from "../../src/lib/events/eventSaveData";

test("Should be able to save data", () => {
  const mockSaveData = jest.fn();
  compile(
    {},
    {
      saveData: mockSaveData
    }
  );
  expect(mockSaveData).toBeCalled();
});
