const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_SAVED_DATA";

const fields = [
  {
    label: l10n("FIELD_IF_SAVED_DATA"),
  },
  {
    key: "true",
    type: "events",
  },
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
];

const compile = (input, helpers) => {
  const { ifDataSaved } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  ifDataSaved(0, truePath, falsePath);
};

module.exports = {
  id,
  fields,
  compile,
};
