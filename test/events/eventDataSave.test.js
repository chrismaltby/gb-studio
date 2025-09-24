import { compile } from "../../src/lib/events/eventDataSave";

test("Should be able to save data", () => {
  const mockDataSave = jest.fn();
  const truePath = [{ command: "EVENT_END", id: "def" }];
  const loadPath = [{ command: "EVENT_END", id: "xyz" }];
  compile(
    {
      saveSlot: 1,
      true: truePath,
      load: loadPath,
    },
    {
      dataSave: mockDataSave,
    },
  );
  expect(mockDataSave).toBeCalledWith(1, truePath, loadPath);
});
