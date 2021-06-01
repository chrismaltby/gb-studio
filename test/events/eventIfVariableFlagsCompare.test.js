import { compile } from "../../src/lib/events/eventIfVariableFlagsCompare";

const temporaryEntityVariable = (num) => `tmp${num + 1}`;

test("Should be able to conditionally execute if variable contains a flag", () => {
  const mockIfVariableValue = jest.fn();
  const mockVariableSetToValue = jest.fn();
  const mockVariableCopy = jest.fn();
  const mockVariablesDiv = jest.fn();
  const mockVariablesMod = jest.fn();
  const mockIfVariableBitwiseValue = jest.fn();
  const truePath = [{ command: "EVENT_END", id: "abc" }];
  const falsePath = [{ command: "EVENT_END", id: "def" }];

  compile(
    {
      variable: "2",
      flag: 5,
      true: truePath,
      false: falsePath,
    },
    {
      ifVariableValue: mockIfVariableValue,
      variableSetToValue: mockVariableSetToValue,
      variableCopy: mockVariableCopy,
      variablesDiv: mockVariablesDiv,
      variablesMod: mockVariablesMod,
      temporaryEntityVariable,
      ifVariableBitwiseValue: mockIfVariableBitwiseValue,
    }
  );

  expect(mockIfVariableBitwiseValue).toBeCalledWith(
    "2",
    ".B_AND",
    32,
    truePath,
    falsePath
  );
});
