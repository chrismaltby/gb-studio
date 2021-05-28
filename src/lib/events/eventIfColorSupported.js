const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_COLOR_SUPPORTED";

const fields = [
  {
    label: l10n("FIELD_IF_COLOR_SUPPORTED"),
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
  const { ifColorSupported } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  ifColorSupported(truePath, falsePath);
};

module.exports = {
  id,
  fields,
  compile,
};
