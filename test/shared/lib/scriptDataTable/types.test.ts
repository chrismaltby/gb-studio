import { isScriptDataTable } from "shared/lib/scriptDataTable/types";

test("Should accept valid script data tables", () => {
  expect(
    isScriptDataTable({
      label: "Data Table",
      variables: ["0", "V0"],
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

test("Should reject script data tables with invalid variable ids", () => {
  expect(
    isScriptDataTable({
      variables: [0],
      rows: [],
    }),
  ).toBe(false);
});

test("Should reject script data tables with invalid row values", () => {
  expect(
    isScriptDataTable({
      variables: ["0"],
      rows: [
        {
          values: [{ foo: "bar" }],
        },
      ],
    }),
  ).toBe(false);
});
