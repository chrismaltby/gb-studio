const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_COLOR_SUPPORTED";
const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_COLOR"];

const fields = [
  {
    label: l10n("FIELD_IF_COLOR_SUPPORTED"),
  },
  {
    key: "true",
    label: l10n("FIELD_TRUE"),
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
  groups,
  fields,
  compile,
};
