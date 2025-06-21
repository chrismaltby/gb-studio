const l10n = require("../helpers/l10n").default;

const id = "EVENT_PEEK_DATA";
const groups = ["EVENT_GROUP_SAVE_DATA", "EVENT_GROUP_VARIABLES"];
const subGroups = {
  EVENT_GROUP_SAVE_DATA: "EVENT_GROUP_VARIABLES",
  EVENT_GROUP_VARIABLES: "EVENT_GROUP_SAVE_DATA",
};

const fields = [
  {
    key: "variableDest",
    label: l10n("FIELD_SET_VARIABLE"),
    description: l10n("FIELD_VARIABLE_SET_DESC"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    type: "group",
    fields: [
      {
        key: "variableSource",
        label: l10n("FIELD_TO_VARIABLE"),
        description: l10n("FIELD_VARIABLE_READ_DESC"),
        type: "variable",
        defaultValue: "LAST_VARIABLE",
      },
      {
        key: "saveSlot",
        label: l10n("FIELD_FROM_SAVE_SLOT"),
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
    ],
  },
];

const compile = (input, helpers) => {
  const { dataPeek } = helpers;
  dataPeek(input.saveSlot, input.variableSource, input.variableDest);
};

module.exports = {
  id,
  description: l10n("EVENT_PEEK_DATA_DESC"),
  groups,
  subGroups,
  fields,
  compile,
};
