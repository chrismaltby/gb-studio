import { compile } from "../../src/lib/events/eventVariableMath";

test("Should be able to set variable to value", () => {
  const mockSetVariableToValue = jest.fn();
  const mockCopyVariable = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "val",
      value: 5,
      operation: "set"
    },
    {
      setVariableToValue: mockSetVariableToValue,
      copyVariable: mockCopyVariable
    }
  );
  expect(mockSetVariableToValue).toBeCalledWith("tmp1", 5);
  expect(mockCopyVariable).toBeCalledWith("2", "tmp1");
});

test("Should be able to set variable to true", () => {
  const mockSetVariableToValue = jest.fn();
  const mockCopyVariable = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "true",
      operation: "set"
    },
    {
      setVariableToValue: mockSetVariableToValue,
      copyVariable: mockCopyVariable
    }
  );
  expect(mockSetVariableToValue).toBeCalledWith("tmp1", 1);
  expect(mockCopyVariable).toBeCalledWith("2", "tmp1");
});

test("Should be able to set variable to false", () => {
  const mockSetVariableToValue = jest.fn();
  const mockCopyVariable = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "false",
      operation: "set"
    },
    {
      setVariableToValue: mockSetVariableToValue,
      copyVariable: mockCopyVariable
    }
  );
  expect(mockSetVariableToValue).toBeCalledWith("tmp1", 0);
  expect(mockCopyVariable).toBeCalledWith("2", "tmp1");
});

test("Should be able to set variable to another variable's value", () => {
  const mockCopyVariable = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "var",
      vectorY: "3",
      operation: "set"
    },
    {
      copyVariable: mockCopyVariable
    }
  );
  expect(mockCopyVariable).toBeCalledWith("tmp1", "3");
  expect(mockCopyVariable).toBeCalledWith("2", "tmp1");
});

test("Should be able to set variable to a random value", () => {
  const mockCopyVariable = jest.fn();
  const mockSetVariableToRandom = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "rnd",
      minValue: 0,
      maxValue: 50
    },
    {
      copyVariable: mockCopyVariable,
      setVariableToRandom: mockSetVariableToRandom
    }
  );
  expect(mockSetVariableToRandom).toBeCalledWith("tmp1", 0, 50);
  expect(mockCopyVariable).toBeCalledWith("2", "tmp1");
});

test("Should be able to set variable to a random with min value", () => {
  const mockCopyVariable = jest.fn();
  const mockSetVariableToRandom = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "rnd",
      minValue: 30,
      maxValue: 50
    },
    {
      copyVariable: mockCopyVariable,
      setVariableToRandom: mockSetVariableToRandom
    }
  );
  expect(mockSetVariableToRandom).toBeCalledWith("tmp1", 30, 20);
  expect(mockCopyVariable).toBeCalledWith("2", "tmp1");
});

test("Should be able to add value to variable", () => {
  const mockSetVariableToValue = jest.fn();
  const mockVariablesAdd = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "val",
      value: 5,
      operation: "add"
    },
    {
      setVariableToValue: mockSetVariableToValue,
      variablesAdd: mockVariablesAdd
    }
  );
  expect(mockSetVariableToValue).toBeCalledWith("tmp1", 5);
  expect(mockVariablesAdd).toBeCalledWith("2", "tmp1");
});

test("Should be able to subtract value from variable", () => {
  const mockSetVariableToValue = jest.fn();
  const mockVariablesSub = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "val",
      value: 5,
      operation: "sub"
    },
    {
      setVariableToValue: mockSetVariableToValue,
      variablesSub: mockVariablesSub
    }
  );
  expect(mockSetVariableToValue).toBeCalledWith("tmp1", 5);
  expect(mockVariablesSub).toBeCalledWith("2", "tmp1");
});

test("Should be able to multiply variable by value", () => {
  const mockSetVariableToValue = jest.fn();
  const mockVariablesMul = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "val",
      value: 5,
      operation: "mul"
    },
    {
      setVariableToValue: mockSetVariableToValue,
      variablesMul: mockVariablesMul
    }
  );
  expect(mockSetVariableToValue).toBeCalledWith("tmp1", 5);
  expect(mockVariablesMul).toBeCalledWith("2", "tmp1");
});

test("Should be able to divide variable by value", () => {
  const mockSetVariableToValue = jest.fn();
  const mockVariablesDiv = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "val",
      value: 5,
      operation: "div"
    },
    {
      setVariableToValue: mockSetVariableToValue,
      variablesDiv: mockVariablesDiv
    }
  );
  expect(mockSetVariableToValue).toBeCalledWith("tmp1", 5);
  expect(mockVariablesDiv).toBeCalledWith("2", "tmp1");
});

test("Should be able to modulus variable by value", () => {
  const mockSetVariableToValue = jest.fn();
  const mockVariablesMod = jest.fn();

  compile(
    {
      vectorX: "2",
      other: "val",
      value: 5,
      operation: "mod"
    },
    {
      setVariableToValue: mockSetVariableToValue,
      variablesMod: mockVariablesMod
    }
  );
  expect(mockSetVariableToValue).toBeCalledWith("tmp1", 5);
  expect(mockVariablesMod).toBeCalledWith("2", "tmp1");
});
