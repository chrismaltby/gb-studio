import { compile } from "../../src/lib/events/eventDataLoad";

test("Should be able to load data", () => {
  const mockDataLoad = jest.fn();
  compile(
    {
      saveSlot: 1,
    },
    {
      dataLoad: mockDataLoad
    }
  );
  expect(mockDataLoad).toBeCalledWith(1);
});
