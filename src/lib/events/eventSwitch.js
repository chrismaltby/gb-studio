const l10n = require("../helpers/l10n").default;

const id = "EVENT_SWITCH";
const groups = ["EVENT_GROUP_CONTROL_FLOW"];

const fields = [].concat(
  [
    {
      key: "variable",
      type: "variable",
      defaultValue: "LAST_VARIABLE",
    },
    {
      key: "choices",
      label: l10n("FIELD_NUMBER_OF_OPTIONS"),
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
        label: `${l10n("FIELD_WHEN")}: $$value${i}$$`,
        conditions: [
          {
            key: "choices",
            gt: i,
          },
        ],
        type: "collapsable",
        defaultValue: false,
      });
      arr.push({
        key: `value${i}`,
        label: l10n("FIELD_VALUE"),
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
        type: "number",
        min: -32768,
        max: 32767,
        defaultValue: i + 1,
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
  const { caseVariableValue } = helpers;
  const falsePath = input.__disableElse ? [] : input.false;

  const choiceLookup = Array(input.choices)
    .fill()
    .reduce((memo, _, i) => {
      const value = input[`value${i}`];
      const key = Number.isInteger(parseInt(value, 10)) ? value : i + 1;
      if (!memo[key]) {
        return {
          ...memo,
          [key]: input[`true${i}`],
        };
      }
      return memo;
    }, {});

  caseVariableValue(input.variable, choiceLookup, falsePath);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
