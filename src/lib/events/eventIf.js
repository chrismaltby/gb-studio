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
  presets: [
    {
      id: "EVENT_IF_TRUE",
      name: l10n("EVENT_IF_TRUE"),
      description: l10n("EVENT_IF_TRUE_DESC"),
      subGroups: {
        EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_VARIABLES",
      },
      values: {
        condition: {
          type: "eq",
          valueA: {
            type: "variable",
            value: "LAST_VARIABLE",
          },
          valueB: {
            type: "true",
          },
        },
      },
    },
    {
      id: "EVENT_IF_FALSE",
      name: l10n("EVENT_IF_FALSE"),
      description: l10n("EVENT_IF_FALSE_DESC"),
      subGroups: {
        EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_VARIABLES",
      },
      values: {
        condition: {
          type: "eq",
          valueA: {
            type: "variable",
            value: "LAST_VARIABLE",
          },
          valueB: {
            type: "false",
          },
        },
      },
    },
    {
      id: "EVENT_IF_EXPRESSION",
      name: l10n("EVENT_IF_EXPRESSION"),
      description: l10n("EVENT_IF_EXPRESSION_DESC"),
      groups: ["EVENT_GROUP_MATH", "EVENT_GROUP_CONTROL_FLOW"],
      subGroups: {
        EVENT_GROUP_MATH: "EVENT_GROUP_CONTROL_FLOW",
        EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_MATH",
      },
      values: {
        condition: {
          type: "expression",
          value: "",
        },
      },
    },
    {
      id: "EVENT_IF_VALUE",
      name: l10n("EVENT_IF_VALUE"),
      description: l10n("EVENT_IF_VALUE_DESC"),
      groups: ["EVENT_GROUP_VARIABLES", "EVENT_GROUP_CONTROL_FLOW"],
      subGroups: {
        EVENT_GROUP_VARIABLES: "EVENT_GROUP_CONTROL_FLOW",
        EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_VARIABLES",
      },
      values: {
        condition: {
          type: "eq",
          valueA: {
            type: "variable",
            value: "LAST_VARIABLE",
          },
          valueB: {
            type: "number",
            value: 0,
          },
        },
      },
    },
    {
      id: "EVENT_IF_VALUE_COMPARE",
      name: l10n("EVENT_IF_VALUE_COMPARE"),
      description: l10n("EVENT_IF_VALUE_COMPARE_DESC"),
      groups: ["EVENT_GROUP_VARIABLES", "EVENT_GROUP_CONTROL_FLOW"],
      subGroups: {
        EVENT_GROUP_VARIABLES: "EVENT_GROUP_CONTROL_FLOW",
        EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_VARIABLES",
      },
      values: {
        condition: {
          type: "eq",
          valueA: {
            type: "variable",
            value: "LAST_VARIABLE",
          },
          valueB: {
            type: "variable",
            value: "LAST_VARIABLE",
          },
        },
      },
    },
  ],
};
