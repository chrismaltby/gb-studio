const l10n = require("../helpers/l10n").default;

const id = "EVENT_LOAD_DATA";
const groups = ["EVENT_GROUP_SAVE_DATA"];

const fields = [
  {
    label: l10n("FIELD_LOAD_DATA"),
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
];

const compile = (input, helpers) => {
  const { dataLoad } = helpers;
  dataLoad(input.saveSlot);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
