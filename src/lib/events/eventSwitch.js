const l10n = require("../helpers/l10n").default;

const id = "EVENT_SWITCH";
const groups = ["EVENT_GROUP_CONTROL_FLOW"];

const fields = [].concat(
  [
    {
      key: "variable",
      label: l10n("FIELD_VARIABLE"),
      description: l10n("FIELD_VARIABLE_DESC"),
      type: "variable",
      defaultValue: "LAST_VARIABLE",
    },
    {
      key: "choices",
      label: l10n("FIELD_NUMBER_OF_OPTIONS"),
      description: l10n("FIELD_NUMBER_OF_OPTIONS_DESC"),
      type: "number",
      min: 1,
      max: 16,
      defaultValue: 2,
    },
  ],
  Array(16)
    .fill()
    .reduce((arr, _, i) => {
      arr.push({
        key: `__collapseCase${i}`,
        conditions: [
          {
            key: "choices",
            gt: i,
          },
        ],
        type: "collapsable",
        defaultValue: false,
        fields: [
          {
            key: `value${i}`,
            label: l10n("FIELD_WHEN"),
            description: l10n("FIELD_VALUE_SWITCH_DESC"),
            type: "constvalue",
            min: -32768,
            max: 32767,
            defaultValue: {
              type: "number",
              value: i + 1,
            },
          },
        ],
      });
      arr.push({
        key: `true${i}`,
        conditions: [
          {
            key: `__collapseCase${i}`,
            ne: true,
          },
          {
            key: "choices",
            gt: i,
          },
        ],
        type: "events",
      });
      return arr;
    }, []),
  [
    {
      key: "__collapseElse",
      label: l10n("FIELD_ELSE"),
      type: "collapsable",
      defaultValue: false,
      conditions: [
        {
          key: "__disableElse",
          ne: true,
        },
      ],
    },
    {
      key: "false",
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
  ]
);

const compile = (input, helpers) => {
  const { caseVariableConstValue } = helpers;
  const falsePath = input.__disableElse ? [] : input.false;

  const choiceLookup = Array(input.choices)
    .fill()
    .map((_, i) => {
      return {
        value: input[`value${i}`],
        branch: input[`true${i}`],
      };
    });

  caseVariableConstValue(input.variable, choiceLookup, falsePath);
};

module.exports = {
  id,
  description: l10n("EVENT_SWITCH_DESC"),
  groups,
  fields,
  compile,
};
