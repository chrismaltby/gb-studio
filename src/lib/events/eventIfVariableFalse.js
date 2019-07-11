import l10n from "../helpers/l10n";

export const id = "EVENT_IF_FALSE";

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
    defaultValue: false
  },
  {
    key: "false",
    conditions: [
      {
        key: "__collapseElse",
        ne: true
      }
    ],
    type: "events"
  }
];

export const compile = (input, helpers) => {
  const { ifVariableTrue } = helpers;
  ifVariableTrue(input.variable, input.false, input.true);
};
