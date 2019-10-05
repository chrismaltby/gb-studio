import { compile } from "../../src/lib/events/eventVariableSetFlags";

test("Should set the flags on the variable", () => {
  const mockVariableSetToValue = jest.fn();

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
      variableSetToValue: mockVariableSetToValue,
    }
  );

  expect(mockVariableSetToValue).toBeCalledWith("2", 129);
});
