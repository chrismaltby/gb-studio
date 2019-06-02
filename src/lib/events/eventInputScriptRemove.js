import l10n from "../helpers/l10n";

export const id = "EVENT_REMOVE_INPUT_SCRIPT";

export const fields = [
  {
    key: "input",
    label: l10n("FIELD_REMOVE_INPUT_SCRIPT_ON"),
    type: "input",
    defaultValue: ["b"]
  }
];

export const compile = (input, helpers) => {
  const { inputScriptRemove } = helpers;
  inputScriptRemove(input.input);
};
