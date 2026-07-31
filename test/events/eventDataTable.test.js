import { compile, fields } from "../../src/lib/events/eventDataTable";

test("Should provide a valid data table default with a variable placeholder", () => {
  expect(fields.find(({ key }) => key === "data")?.defaultValue).toEqual({
    variables: ["LAST_VARIABLE"],
    rows: [
      {
        label: "",
        values: [{ type: "number", value: 0 }],
      },
    ],
  });
});

test("Should compile variable data table lookups", () => {
  const mockVariableDataTableLookup = jest.fn();

  compile(
    {
      indexVariable: "0",
      data: {
        variables: ["1"],
        rows: [
          {
            label: "Row 1",
            values: [{ type: "number", value: 1 }],
          },
        ],
      },
    },
    {
      variableDataTableLookup: mockVariableDataTableLookup,
    },
  );

  expect(mockVariableDataTableLookup).toHaveBeenCalledWith("0", {
    variables: ["1"],
    rows: [
      {
        label: "Row 1",
        values: [{ type: "number", value: 1 }],
      },
    ],
  });
});
