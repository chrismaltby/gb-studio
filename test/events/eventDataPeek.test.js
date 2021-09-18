import { compile } from "../../src/lib/events/eventDataPeek";

test("Should be able to save data", () => {
  const mockDataPeek = jest.fn();
  const truePath = [{ command: "EVENT_END", id: "def" }];
  compile(
    {
      saveSlot: 1,
      variableDest: 12,
      variableSource: 14,
    },
    {
      dataPeek: mockDataPeek
    }
  );
  expect(mockDataPeek).toBeCalledWith(1, 14, 12);
});
