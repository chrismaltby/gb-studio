const l10n = require("../helpers/l10n").default;

const id = "EVENT_SET_MUSIC_ROUTINE";
const groups = ["EVENT_GROUP_MUSIC"];
const subGroups = {
  EVENT_GROUP_MUSIC: "EVENT_GROUP_SCRIPT",
};

const fields = [
  {
    key: "routine",
    label: l10n("FIELD_ROUTINE"),
    description: l10n("FIELD_ROUTINE_DESC"),
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
    description: l10n("FIELD_ON_CALL_ROUTINE_DESC"),
    type: "events",
    allowedContexts: ["global", "entity", "prefab"],
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
  description: l10n("EVENT_SET_MUSIC_ROUTINE_DESC"),
  references: ["/docs/assets/music/music-huge#effects"],
  groups,
  subGroups,
  fields,
  compile,
  editableSymbol: true,
  allowChildrenBeforeInitFade: true,
};
