const l10n = require("../helpers/l10n").default;

const id = "EVENT_PEEK_DATA";
const groups = ["EVENT_GROUP_SAVE_DATA", "EVENT_GROUP_VARIABLES"];

const fields = [
  {
    key: "variableDest",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    type: "break",
  },
  {
    key: "saveSlot",
    label: l10n("FIELD_SAVE_SLOT"),
    type: "select",
    options: [
      [0, l10n("FIELD_SAVE_SLOT_1")],
      [1, l10n("FIELD_SAVE_SLOT_2")],
      [2, l10n("FIELD_SAVE_SLOT_3")],
    ],
    defaultValue: 0,
    width: "50%",
  },
  {
    key: "variableSource",
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
];

const compile = (input, helpers) => {
  const { dataPeek } = helpers;
  dataPeek(input.variableSource, input.variableDest, input.saveSlot);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
