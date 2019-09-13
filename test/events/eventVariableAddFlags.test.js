import { compile } from "../../src/lib/events/eventVariableAddFlags";

test("Should set the flags on the variable", () => {
  const mockVariableAddFlags = jest.fn();

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
      variableAddFlags: mockVariableAddFlags,
    }
  );

  expect(mockVariableAddFlags).toBeCalledWith("2", 129);
});
