const l10n = require("../helpers/l10n").default;

const id = "EVENT_SET_INPUT_SCRIPT";
const groups = ["EVENT_GROUP_INPUT"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_SET_INPUT_SCRIPT_LABEL", {
    input: fetchArg("input"),
  });
};

const fields = [
  {
    key: "input",
    label: l10n("FIELD_BUTTON"),
    description: l10n("FIELD_BUTTON_DESC"),
    type: "input",
    defaultValue: ["b"],
  },
  {
    key: "override",
    type: "checkbox",
    label: l10n("FIELD_OVERRIDE_DEFAULT_BUTTON_ACTION"),
    description: l10n("FIELD_OVERRIDE_DEFAULT_BUTTON_ACTION_DESC"),
    defaultValue: true,
  },
  {
    key: "__scriptTabs",
    type: "tabs",
    defaultValue: "press",
    values: {
      press: l10n("FIELD_ON_PRESS"),
    },
  },
  {
    key: "true",
    label: l10n("FIELD_ON_PRESS"),
    description: l10n("FIELD_ON_PRESS_DESC"),
    type: "events",
    allowedContexts: ["global", "entity", "prefab"],
    conditions: [
      {
        key: "__scriptTabs",
        in: [undefined, "press"],
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { inputScriptSet, event } = helpers;
  inputScriptSet(
    input.input,
    input.override !== false,
    input.true,
    event.symbol,
  );
};

module.exports = {
  id,
  description: l10n("EVENT_SET_INPUT_SCRIPT_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
  editableSymbol: true,
  allowChildrenBeforeInitFade: true,
};
