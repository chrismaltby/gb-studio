import l10n from "../helpers/l10n";

export const id = "EVENT_SET_INPUT_SCRIPT";

export const fields = [
  {
    key: "input",
    label: l10n("FIELD_ON_PRESS"),
    type: "input",
    defaultValue: "b"
  },
  {
    key: "true",
    type: "events"
  }
];

export const compile = (input, helpers) => {
  const { inputScriptSet } = helpers;
  inputScriptSet(input.input, input.true);
};
