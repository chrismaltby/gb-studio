const l10n = require("../helpers/l10n").default;

const id = "EVENT_SET_MUSIC_ROUTINE";
const groups = ["EVENT_GROUP_MUSIC"];

const fields = [
  {
    key: "routine",
    type: "number",
    defaultValue: 0,
    min: 0,
    max: 3,
  },
  {
    key: "__scriptTabs",
    type: "tabs",
    defaultValue: "trigger",
    values: {
      trigger: l10n("FIELD_ON_CALL"),
    },
  },
  {
    key: "true",
    label: l10n("FIELD_ON_CALL"),
    type: "events",
    allowedContexts: ["global", "entity"],
    conditions: [
      {
        key: "__scriptTabs",
        in: [undefined, "trigger"],
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { musicRoutineSet, event } = helpers;
  musicRoutineSet(input.routine, input.true, event.symbol);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
  editableSymbol: true,
  allowChildrenBeforeInitFade: true,
};
