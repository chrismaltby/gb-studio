const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF";
const groups = ["EVENT_GROUP_CONTROL_FLOW"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_IF_LABEL", {
    condition: fetchArg("condition"),
  });
};

const fields = [
  {
    key: "condition",
    label: l10n("FIELD_CONDITION"),
    description: l10n("FIELD_CONDITION_DESC"),
    type: "value",
    defaultValue: {
      type: "eq",
      valueA: {
        type: "variable",
        value: "LAST_VARIABLE",
      },
      valueB: {
        type: "number",
        value: 1,
      },
    },
  },
  {
    key: "true",
    label: l10n("FIELD_TRUE"),
    description: l10n("FIELD_TRUE_DESC"),
    type: "events",
  },
  {
    key: "__collapseElse",
    label: l10n("FIELD_ELSE"),
    type: "collapsable",
    defaultValue: true,
    conditions: [
      {
        key: "__disableElse",
        ne: true,
      },
    ],
  },
  {
    key: "false",
    label: l10n("FIELD_FALSE"),
    description: l10n("FIELD_FALSE_DESC"),
    conditions: [
      {
        key: "__collapseElse",
        ne: true,
      },
      {
        key: "__disableElse",
        ne: true,
      },
    ],
    type: "events",
  },
];

const compile = (input, helpers) => {
  const { ifScriptValue } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  ifScriptValue(input.condition, truePath, falsePath);
};

module.exports = {
  id,
  description: l10n("EVENT_IF_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
};
