const l10n = require("../helpers/l10n");

const id = "EVENT_IF_INPUT";

const fields = [
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

const compile = (input, helpers) => {
  const { ifInput } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  ifInput(input.input, truePath, falsePath);
};

module.exports = {
  id,
  fields,
  compile
};
