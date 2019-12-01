import l10n from "../helpers/l10n";

export const id = "EVENT_IF_INPUT";

export const fields = [
  {
    key: "input",
    label: l10n("FIELD_ANY_OF"),
    type: "input",
    defaultValue: ["a", "b"]
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
  const { ifInput } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  ifInput(input.input, truePath, falsePath);
};
