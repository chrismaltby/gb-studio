import { variablesToOptions } from "components/forms/AddReferenceMenu";

jest.mock("shared/lib/lang/l10n", () => ({
  __esModule: true,
  default: (key: string) => (key === "FIELD_VARIABLE" ? "Variable" : key),
}));

test("builds reference options from defined variables without exposing ids", () => {
  const options = variablesToOptions([
    {
      id: "abcdef01-2345-6789-abcd-ef0123456789",
      name: "",
      symbol: "var_7",
      type: "number",
    },
    {
      id: "abcdef01-2345-6789-abcd-ef0123456790",
      name: "Inventory",
      symbol: "var_inventory",
      type: "array",
      size: 4,
    },
  ]);

  expect(options).toEqual([
    {
      label: "Inventory[4]",
      value: "abcdef01-2345-6789-abcd-ef0123456790",
      referenceType: "variable",
    },
    {
      label: "Variable 1",
      value: "abcdef01-2345-6789-abcd-ef0123456789",
      referenceType: "variable",
    },
  ]);
  expect(options.map(({ label }) => label).join(" ")).not.toContain("abcdef");
});
