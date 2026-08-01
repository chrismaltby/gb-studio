import { isScriptDataTable } from "shared/lib/scriptDataTable/types";

test("Should accept valid script data tables", () => {
  expect(
    isScriptDataTable({
      label: "Data Table",
      variables: [
        { type: "variable", value: "0" },
        { type: "variable", value: "V0" },
      ],
      rows: [
        {
          label: "Row 1",
          values: [
            { type: "number", value: 1 },
            { type: "constant", value: "engine::MAX_HP" },
          ],
        },
        {
          label: "Row 2",
          values: [undefined, { type: "number", value: 2 }],
        },
      ],
    }),
  ).toBe(true);
});

test("Should accept fixed array elements as data table variables", () => {
  expect(
    isScriptDataTable({
      variables: [
        {
          type: "variable",
          value: "array-1",
          index: { type: "number", value: 2 },
        },
      ],
      rows: [],
    }),
  ).toBe(true);
});

test.each(["variable", "constant"])(
  "Should reject %s array indexes in data table variables",
  (indexType) => {
    expect(
      isScriptDataTable({
        variables: [
          {
            type: "variable",
            value: "array-1",
            index: { type: indexType, value: "index-1" },
          },
        ],
        rows: [],
      }),
    ).toBe(false);
  },
);

test("Should reject legacy string data table variables", () => {
  expect(
    isScriptDataTable({
      variables: ["0"],
      rows: [],
    }),
  ).toBe(false);
});

test("Should reject script data tables with invalid row values", () => {
  expect(
    isScriptDataTable({
      variables: [{ type: "variable", value: "0" }],
      rows: [
        {
          values: [{ foo: "bar" }],
        },
      ],
    }),
  ).toBe(false);
});
