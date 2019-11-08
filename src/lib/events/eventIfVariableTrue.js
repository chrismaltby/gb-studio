import l10n from "../helpers/l10n";

export const id = "EVENT_IF_TRUE";

export const fields = [
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE"
  },
  {
    key: "true",
    type: "events"
  },
  {
    key: "__collapseElse",
    label: l10n("FIELD_ELSE"),
    type: "collapsable",
    defaultValue: false,
    conditions: [
      {
        key: "__disableElse",
        ne: true
      }
    ]
  },
  {
    key: "false",
    conditions: [
      {
        key: "__collapseElse",
        ne: true
      },
      {
        key: "__disableElse",
        ne: true
      }
    ],
    type: "events"
  }
];

export const compile = (input, helpers) => {
  const { ifVariableTrue } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  ifVariableTrue(input.variable, truePath, falsePath);
};
