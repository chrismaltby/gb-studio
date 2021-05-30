import { compile } from "../../src/lib/events/eventIfVariableFlagsCompare";

const temporaryEntityVariable = (num) => `tmp${num + 1}`;

test("Should be able to conditionally execute if variable contains a flag", () => {
  const mockIfVariableValue = jest.fn();
  const mockVariableSetToValue = jest.fn();
  const mockVariableCopy = jest.fn();
  const mockVariablesDiv = jest.fn();
  const mockVariablesMod = jest.fn();
  const truePath = [{ command: "EVENT_END", id: "abc" }];
  const falsePath = [{ command: "EVENT_END", id: "def" }];

  compile(
    {
      variable: "2",
      flag: 5,
      true: truePath,
      false: falsePath
    },
    {
      ifVariableValue: mockIfVariableValue, 
      variableSetToValue: mockVariableSetToValue,
      variableCopy: mockVariableCopy,
      variablesDiv: mockVariablesDiv,
      variablesMod: mockVariablesMod,
      temporaryEntityVariable
    }
  );

  expect(mockVariableCopy).toBeCalledWith("tmp1", "2");
  expect(mockVariableSetToValue).toBeCalledWith("tmp2", 32);
  expect(mockVariablesDiv).toBeCalledWith("tmp1", "tmp2");
  expect(mockVariableSetToValue).toBeCalledWith("tmp2", 2);
  expect(mockVariablesMod).toBeCalledWith("tmp1", "tmp2");

  expect(mockIfVariableValue).toBeCalledWith("tmp1", "==", 1, truePath, falsePath);
});
