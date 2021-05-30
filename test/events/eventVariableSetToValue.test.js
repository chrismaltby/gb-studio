import { compile } from "../../src/lib/events/eventVariableSetToValue";

test("Should set variable to a value", () => {
  const mockVariableSetToValue = jest.fn();
  compile(
    {
      variable: "2",
      value: {
        type: "number",
        value: 9
      }
    },
    {
      variableSetToValue: mockVariableSetToValue
    }
  );
  expect(mockVariableSetToValue).toBeCalledWith("2", 9);
});

test("Should set variable to true if value was 1", () => {
  const mockVariableSetToTrue = jest.fn();
  compile(
    {
      variable: "2",
      value: {
        type: "number",
        value: 1
      }
    },
    {
      variableSetToTrue: mockVariableSetToTrue
    }
  );
  expect(mockVariableSetToTrue).toBeCalledWith("2");
});

test("Should set variable to true if value was 1 as a string", () => {
  const mockVariableSetToTrue = jest.fn();
  compile(
    {
      variable: "2",
      value: {
        type: "number",
        value: "1"
      }
    },
    {
      variableSetToTrue: mockVariableSetToTrue
    }
  );
  expect(mockVariableSetToTrue).toBeCalledWith("2");
});


test("Should set variable to false if value was 0", () => {
  const mockVariableSetToFalse = jest.fn();
  compile(
    {
      variable: "2",
      value: {
        type: "number",
        value: 0
      }
    },
    {
      variableSetToFalse: mockVariableSetToFalse
    }
  );
  expect(mockVariableSetToFalse).toBeCalledWith("2");
});

test("Should set variable to false if value was undefined", () => {
  const mockVariableSetToFalse = jest.fn();
  compile(
    {
      variable: "2",
      value: {
        type: "number",
        value: undefined
      }
    },
    {
      variableSetToFalse: mockVariableSetToFalse
    }
  );
  expect(mockVariableSetToFalse).toBeCalledWith("2");
});
