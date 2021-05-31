import { compile } from "../../src/lib/events/eventVariableMath";

test("Should be able to set variable to value", () => {
  const mockVariableSetToValue = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "val",
      value: 5,
      operation: "set",
    },
    {
      variableSetToValue: mockVariableSetToValue,
    }
  );
  expect(mockVariableSetToValue).toBeCalledWith("2", 5);
});

test("Should be able to set variable to true", () => {
  const mockVariableSetToValue = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "true",
      operation: "set",
    },
    {
      variableSetToValue: mockVariableSetToValue,
    }
  );
  expect(mockVariableSetToValue).toBeCalledWith("2", 1);
});

test("Should be able to set variable to false", () => {
  const mockVariableSetToValue = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "false",
      operation: "set",
    },
    {
      variableSetToValue: mockVariableSetToValue,
    }
  );
  expect(mockVariableSetToValue).toBeCalledWith("2", 0);
});

test("Should be able to set variable to another variable's value", () => {
  const mockVariableCopy = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "var",
      vectorY: "3",
      operation: "set",
    },
    {
      variableCopy: mockVariableCopy,
    }
  );
  expect(mockVariableCopy).toBeCalledWith("2", "3");
});

test("Should be able to set variable to a random value", () => {
  const mockVariableSetToRandom = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "rnd",
      minValue: 0,
      maxValue: 50,
    },
    {
      variableSetToRandom: mockVariableSetToRandom,
    }
  );
  expect(mockVariableSetToRandom).toBeCalledWith("2", 0, 51);
});

test("Should be able to set variable to a random with min value", () => {
  const mockVariableSetToRandom = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "rnd",
      minValue: 30,
      maxValue: 50,
    },
    {
      variableSetToRandom: mockVariableSetToRandom,
    }
  );
  expect(mockVariableSetToRandom).toBeCalledWith("2", 30, 21);
});

test("Should be able to add value to variable", () => {
  const mockVariableValueOperation = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "val",
      value: 5,
      clamp: true,
      operation: "add",
    },
    {
      variableValueOperation: mockVariableValueOperation,
    }
  );
  expect(mockVariableValueOperation).toBeCalledWith("2", ".ADD", 5, true);
});

test("Should be able to subtract value from variable", () => {
  const mockVariableValueOperation = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "val",
      value: 5,
      clamp: true,
      operation: "sub",
    },
    {
      variableValueOperation: mockVariableValueOperation,
    }
  );
  expect(mockVariableValueOperation).toBeCalledWith("2", ".SUB", 5, true);
});

test("Should be able to multiply variable by value", () => {
  const mockVariableValueOperation = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "val",
      value: 5,
      operation: "mul",
    },
    {
      variableValueOperation: mockVariableValueOperation,
    }
  );
  expect(mockVariableValueOperation).toBeCalledWith("2", ".MUL", 5, undefined);
});

test("Should be able to divide variable by value", () => {
  const mockVariableValueOperation = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "val",
      value: 5,
      operation: "div",
    },
    {
      variableValueOperation: mockVariableValueOperation,
    }
  );
  expect(mockVariableValueOperation).toBeCalledWith("2", ".DIV", 5, undefined);
});

test("Should be able to modulus variable by value", () => {
  const mockVariableValueOperation = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "val",
      value: 5,
      operation: "mod",
    },
    {
      variableValueOperation: mockVariableValueOperation,
    }
  );
  expect(mockVariableValueOperation).toBeCalledWith("2", ".MOD", 5, undefined);
});
