const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_SAVED_DATA";
const groups = ["EVENT_GROUP_SAVE_DATA", "EVENT_GROUP_CONTROL_FLOW"];

const fields = [
  {
    label: l10n("FIELD_IF_SAVED_DATA"),
  },
  {
    key: "saveSlot",
    type: "select",
    options: [
      [0, l10n("FIELD_SAVE_SLOT_1")],
      [1, l10n("FIELD_SAVE_SLOT_2")],
      [2, l10n("FIELD_SAVE_SLOT_3")],
    ],
    defaultValue: 0,
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
  const { ifDataSaved } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  ifDataSaved(input.saveSlot, truePath, falsePath);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
