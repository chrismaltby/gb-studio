const l10n = require("../helpers/l10n").default;

const id = "EVENT_LOOP_WHILE";
const groups = ["EVENT_GROUP_CONTROL_FLOW"];

const autoLabel = (fetchArg, args) => {
  if (args.expression) {
    return l10n("EVENT_LOOP_WHILE_LABEL", {
      expression: fetchArg("expression"),
    });
  } else {
    return l10n("EVENT_LOOP_WHILE");
  }
};

const fields = [
  {
    key: "condition",
    label: l10n("FIELD_CONDITION"),
    description: l10n("FIELD_CONDITION_DESC"),
    type: "value",
    defaultValue: {
      type: "lt",
      valueA: {
        type: "variable",
        value: "LAST_VARIABLE",
      },
      valueB: {
        type: "number",
        value: 10,
      },
    },
  },
  {
    key: "true",
    type: "events",
  },
];

const compile = (input, helpers) => {
  const { whileScriptValue } = helpers;
  const truePath = input.true;
  whileScriptValue(input.condition, truePath);
};

module.exports = {
  id,
  description: l10n("EVENT_LOOP_WHILE_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
  presets: [
    {
      id: "EVENT_LOOP_WHILE_EXPRESSION",
      name: l10n("EVENT_LOOP_WHILE_EXPRESSION"),
      description: l10n("EVENT_LOOP_WHILE_DESC"),
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
  ],
};
