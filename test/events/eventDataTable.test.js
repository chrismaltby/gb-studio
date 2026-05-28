import { compile } from "../../src/lib/events/eventDataTable";

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
