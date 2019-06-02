import l10n from "../helpers/l10n";

export const id = "EVENT_IF_INPUT";

export const fields = [
  {
    key: "input",
    label: l10n("FIELD_ANY_OF"),
    type: "input",
    defaultValue: ["a", "b"]
  },
  {
    key: "true",
    type: "events"
  },
  {
    key: "false",
    type: "events"
  }
];

export const compile = (input, helpers) => {
  const { ifInput } = helpers;
  ifInput(input.input, input.true, input.false);
};
