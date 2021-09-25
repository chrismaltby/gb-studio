const l10n = require("../helpers/l10n").default;

const id = "EVENT_SAVE_DATA";
const groups = ["EVENT_GROUP_SAVE_DATA"];

const fields = [
  {
    label: l10n("FIELD_SAVE_DATA"),
  },
  {
    key: "saveSlot",
    label: l10n("FIELD_SAVE_SLOT"),
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
    key: "__scriptTabs",
    type: "tabs",
    defaultValue: "save",
    values: {
      save: l10n("FIELD_ON_SAVE"),
    },
  },
  {
    key: "true",
    label: l10n("FIELD_ON_SAVE"),
    type: "events",
  },
];

const compile = (input, helpers) => {
  const { dataSave } = helpers;
  dataSave(input.saveSlot, input.true);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
