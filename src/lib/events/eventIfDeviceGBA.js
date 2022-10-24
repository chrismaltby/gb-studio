const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_DEVICE_GBA";
const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_COLOR"];

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
  const { ifDeviceGBA } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  ifDeviceGBA(truePath, falsePath);
};

module.exports = {
  id,
  description: l10n("EVENT_IF_DEVICE_GBA_DESC"),
  groups,
  fields,
  compile,
};
