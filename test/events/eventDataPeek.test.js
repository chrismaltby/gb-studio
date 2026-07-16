import { compile } from "../../src/lib/events/eventDataPeek";

test("Should be able to save data", () => {
  const mockDataPeek = jest.fn();
  compile(
    {
      saveSlot: 1,
      variableDest: 12,
      variableSource: 14,
    },
    {
      dataPeek: mockDataPeek,
    },
  );
  expect(mockDataPeek).toHaveBeenCalledWith(1, 14, 12);
});
