import { compile } from "../../src/lib/events/eventLoadData";

test("Should be able to load data", () => {
  const mockLoadData = jest.fn();
  compile(
    {},
    {
      loadData: mockLoadData
    }
  );
  expect(mockLoadData).toBeCalled();
});
