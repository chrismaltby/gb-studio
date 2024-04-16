const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_COLOR_SUPPORTED";
const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_COLOR"];
const subGroups = {
  EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_DEVICE",
  EVENT_GROUP_COLOR: "EVENT_GROUP_CONTROL_FLOW",
};

const fields = [
  {
    key: "true",
    label: l10n("FIELD_TRUE"),
    description: l10n("FIELD_TRUE_DESC"),
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
    description: l10n("FIELD_FALSE_DESC"),
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
  const { ifDeviceCGB } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  ifDeviceCGB(truePath, falsePath);
};

module.exports = {
  id,
  description: l10n("EVENT_IF_COLOR_SUPPORTED_DESC"),
  groups,
  subGroups,
  fields,
  compile,
};
