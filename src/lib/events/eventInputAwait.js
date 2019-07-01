import l10n from "../helpers/l10n";

export const id = "EVENT_AWAIT_INPUT";

export const fields = [
  {
    key: "input",
    label: l10n("FIELD_ANY_OF"),
    type: "input",
    defaultValue: ["a", "b"]
  }
];

export const compile = (input, helpers) => {
  const { inputAwait } = helpers;
  inputAwait(input.input);
};
