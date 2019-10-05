import { compile } from "../../src/lib/events/eventVariableClearFlags";

test("Should set the flags on the variable", () => {
  const mockVariableClearFlags = jest.fn();

  compile(
    {
      variable: "2",
      flag1: true,
      flag2: false,
      flag3: false,
      flag4: false,
      flag5: false,
      flag6: false,
      flag7: false,
      flag8: true
    },
    {
      variableClearFlags: mockVariableClearFlags,
    }
  );

  expect(mockVariableClearFlags).toBeCalledWith("2", 129);
});
