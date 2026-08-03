import { variableNameForScriptEventTitle } from "components/script/hooks/useScriptEventTitle";
import type { NamedVariable } from "renderer/lib/variables";

const namedVariable = (id: string, name: string): NamedVariable => ({
  id,
  code: id,
  name,
  displayName: name,
  group: "Global",
});

test("uses the defined name for a UUID variable beginning with zero", () => {
  const variableId = "0fa94043-5b72-4ae4-a36f-56bc5a9cc875";
  const variable = namedVariable(variableId, "Player Health");

  expect(
    variableNameForScriptEventTitle(variableId, {
      [variableId]: variable,
    }),
  ).toBe("$PlayerHealth");
});

test("continues to normalize legacy zero-padded numeric variable IDs", () => {
  const variable = namedVariable("4", "Player Health");

  expect(
    variableNameForScriptEventTitle("04", {
      [variable.id]: variable,
    }),
  ).toBe("$PlayerHealth");
});

test("preserves an unknown variable ID in the title", () => {
  const variableId = "0fa94043-5b72-4ae4-a36f-56bc5a9cc875";

  expect(variableNameForScriptEventTitle(variableId, {})).toBe(
    `$${variableId}`,
  );
});
