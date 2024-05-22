const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_SAVED_DATA";
const groups = ["EVENT_GROUP_SAVE_DATA", "EVENT_GROUP_CONTROL_FLOW"];
const subGroups = {
  "EVENT_GROUP_SAVE_DATA": "EVENT_GROUP_CONTROL_FLOW",
  "EVENT_GROUP_CONTROL_FLOW": "EVENT_GROUP_SAVE_DATA"
}
const fields = [
  {
    key: "saveSlot",
    label: l10n("FIELD_SAVE_SLOT"),
    description: l10n("FIELD_SAVE_SLOT_DESC"),
    type: "togglebuttons",
    options: [
      [
        0,
        l10n("FIELD_SLOT_N", { slot: 1 }),
        l10n("FIELD_SAVE_SLOT_N", { slot: 1 }),
      ],
      [
        1,
        l10n("FIELD_SLOT_N", { slot: 2 }),
        l10n("FIELD_SAVE_SLOT_N", { slot: 2 }),
      ],
      [
        2,
        l10n("FIELD_SLOT_N", { slot: 3 }),
        l10n("FIELD_SAVE_SLOT_N", { slot: 3 }),
      ],
    ],
    allowNone: false,
    defaultValue: 0,
  },
  {
    label: l10n("FIELD_IF_SAVED_DATA"),
  },
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
  const { ifDataSaved } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  ifDataSaved(input.saveSlot, truePath, falsePath);
};

module.exports = {
  id,
  description: l10n("EVENT_IF_SAVED_DATA_DESC"),
  groups,
  subGroups,
  fields,
  compile,
};
