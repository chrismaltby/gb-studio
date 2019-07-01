import { compile } from "../../src/lib/events/eventVariableMath";

test("Should be able to set variable to value", () => {
  const mockVariableSetToValue = jest.fn();
  const mockVariableCopy = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "val",
      value: 5,
      operation: "set"
    },
    {
      variableSetToValue: mockVariableSetToValue,
      variableCopy: mockVariableCopy
    }
  );
  expect(mockVariableSetToValue).toBeCalledWith("tmp1", 5);
  expect(mockVariableCopy).toBeCalledWith("2", "tmp1");
});

test("Should be able to set variable to true", () => {
  const mockVariableSetToValue = jest.fn();
  const mockVariableCopy = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "true",
      operation: "set"
    },
    {
      variableSetToValue: mockVariableSetToValue,
      variableCopy: mockVariableCopy
    }
  );
  expect(mockVariableSetToValue).toBeCalledWith("tmp1", 1);
  expect(mockVariableCopy).toBeCalledWith("2", "tmp1");
});

test("Should be able to set variable to false", () => {
  const mockVariableSetToValue = jest.fn();
  const mockVariableCopy = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "false",
      operation: "set"
    },
    {
      variableSetToValue: mockVariableSetToValue,
      variableCopy: mockVariableCopy
    }
  );
  expect(mockVariableSetToValue).toBeCalledWith("tmp1", 0);
  expect(mockVariableCopy).toBeCalledWith("2", "tmp1");
});

test("Should be able to set variable to another variable's value", () => {
  const mockVariableCopy = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "var",
      vectorY: "3",
      operation: "set"
    },
    {
      variableCopy: mockVariableCopy
    }
  );
  expect(mockVariableCopy).toBeCalledWith("tmp1", "3");
  expect(mockVariableCopy).toBeCalledWith("2", "tmp1");
});

test("Should be able to set variable to a random value", () => {
  const mockVariableCopy = jest.fn();
  const mockVariableSetToRandom = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "rnd",
      minValue: 0,
      maxValue: 50
    },
    {
      variableCopy: mockVariableCopy,
      variableSetToRandom: mockVariableSetToRandom
    }
  );
  expect(mockVariableSetToRandom).toBeCalledWith("tmp1", 0, 50);
  expect(mockVariableCopy).toBeCalledWith("2", "tmp1");
});

test("Should be able to set variable to a random with min value", () => {
  const mockVariableCopy = jest.fn();
  const mockVariableSetToRandom = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "rnd",
      minValue: 30,
      maxValue: 50
    },
    {
      variableCopy: mockVariableCopy,
      variableSetToRandom: mockVariableSetToRandom
    }
  );
  expect(mockVariableSetToRandom).toBeCalledWith("tmp1", 30, 20);
  expect(mockVariableCopy).toBeCalledWith("2", "tmp1");
});

test("Should be able to add value to variable", () => {
  const mockVariableSetToValue = jest.fn();
  const mockVariablesAdd = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "val",
      value: 5,
      operation: "add"
    },
    {
      variableSetToValue: mockVariableSetToValue,
      variablesAdd: mockVariablesAdd
    }
  );
  expect(mockVariableSetToValue).toBeCalledWith("tmp1", 5);
  expect(mockVariablesAdd).toBeCalledWith("2", "tmp1");
});

test("Should be able to subtract value from variable", () => {
  const mockVariableSetToValue = jest.fn();
  const mockVariablesSub = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "val",
      value: 5,
      operation: "sub"
    },
    {
      variableSetToValue: mockVariableSetToValue,
      variablesSub: mockVariablesSub
    }
  );
  expect(mockVariableSetToValue).toBeCalledWith("tmp1", 5);
  expect(mockVariablesSub).toBeCalledWith("2", "tmp1");
});

test("Should be able to multiply variable by value", () => {
  const mockVariableSetToValue = jest.fn();
  const mockVariablesMul = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "val",
      value: 5,
      operation: "mul"
    },
    {
      variableSetToValue: mockVariableSetToValue,
      variablesMul: mockVariablesMul
    }
  );
  expect(mockVariableSetToValue).toBeCalledWith("tmp1", 5);
  expect(mockVariablesMul).toBeCalledWith("2", "tmp1");
});

test("Should be able to divide variable by value", () => {
  const mockVariableSetToValue = jest.fn();
  const mockVariablesDiv = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "val",
      value: 5,
      operation: "div"
    },
    {
      variableSetToValue: mockVariableSetToValue,
      variablesDiv: mockVariablesDiv
    }
  );
  expect(mockVariableSetToValue).toBeCalledWith("tmp1", 5);
  expect(mockVariablesDiv).toBeCalledWith("2", "tmp1");
});

test("Should be able to modulus variable by value", () => {
  const mockVariableSetToValue = jest.fn();
  const mockVariablesMod = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "val",
      value: 5,
      operation: "mod"
    },
    {
      variableSetToValue: mockVariableSetToValue,
      variablesMod: mockVariablesMod
    }
  );
  expect(mockVariableSetToValue).toBeCalledWith("tmp1", 5);
  expect(mockVariablesMod).toBeCalledWith("2", "tmp1");
});
