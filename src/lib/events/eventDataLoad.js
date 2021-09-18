const l10n = require("../helpers/l10n").default;

const id = "EVENT_LOAD_DATA";
const groups = ["EVENT_GROUP_SAVE_DATA"];

const fields = [
  {
    label: l10n("FIELD_LOAD_DATA"),
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
