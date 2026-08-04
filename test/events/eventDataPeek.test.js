import { compile, fields } from "../../src/lib/events/eventDataPeek";

test("Should not allow custom event parameters as source variables", () => {
  expect(fields[1].fields[0]).toMatchObject({
    key: "variableSource",
    type: "variableElement",
    allowCustomEventParameters: false,
    defaultValue: { type: "variable", value: "LAST_VARIABLE" },
  });
});

test("Should be able to save data", () => {
  const mockDataPeek = jest.fn();
  const variableSource = {
    type: "variable",
    value: "array",
    index: { type: "number", value: 2 },
  };
  compile(
    {
      saveSlot: 1,
      variableDest: 12,
      variableSource,
    },
    {
      dataPeek: mockDataPeek,
    },
  );
  expect(mockDataPeek).toHaveBeenCalledWith(1, variableSource, 12);
});
