const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_VALUE_IN_ARRAY";
const groups = ["EVENT_GROUP_VARIABLES", "EVENT_GROUP_CONTROL_FLOW"];
const subGroups = {
  EVENT_GROUP_VARIABLES: "EVENT_GROUP_CONTROL_FLOW",
  EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_VARIABLES",
};

const autoLabel = (fetchArg) => {
  return l10n("EVENT_IF_VALUE_IN_ARRAY_LABEL", {
    value: fetchArg("value"),
    array: fetchArg("array"),
  });
};

const fields = [
  {
    key: "value",
    label: l10n("FIELD_VALUE"),
    description: l10n("FIELD_VALUE_IN_ARRAY_DESC"),
    type: "value",
    defaultValue: { type: "number", value: 0 },
  },
  {
    key: "array",
    label: l10n("FIELD_IN_ARRAY"),
    description: l10n("FIELD_IN_ARRAY_TO_SEARCH_DESC"),
    type: "variable",
    variableType: "arrayReference",
    defaultValue: "LAST_VARIABLE",
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
  const { ifValueInArray } = helpers;
  ifValueInArray(input.value, input.array, input.true, input.false);
};

module.exports = {
  id,
  description: l10n("EVENT_IF_VALUE_IN_ARRAY_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
};
