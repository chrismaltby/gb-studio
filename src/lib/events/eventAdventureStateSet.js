const l10n = require("../helpers/l10n").default;

const id = "EVENT_ADVENTURE_STATE_SET";
const groups = ["EVENT_GROUP_ENGINE_FIELDS"];
const subGroups = {
  EVENT_GROUP_ENGINE_FIELDS: "GAMETYPE_ADVENTURE",
};

const labelsMap = {
  ground: l10n("FIELD_GROUND_STATE"),
  dash: l10n("FIELD_DASH_STATE"),
  knockback: l10n("FIELD_KNOCKBACK_STATE"),
  blank: l10n("FIELD_BLANK_STATE"),
  run: l10n("FIELD_RUN_STATE"),
  push: l10n("FIELD_PUSH_STATE"),
};

const valuesMap = {
  ground: "ADVENTURE_GROUND_STATE",
  dash: "ADVENTURE_DASH_STATE",
  knockback: "ADVENTURE_KNOCKBACK_STATE",
  blank: "ADVENTURE_BLANK_STATE",
  run: "ADVENTURE_RUN_STATE",
  push: "ADVENTURE_PUSH_STATE",
};

const autoLabel = (_, input) => {
  return l10n("EVENT_ADVENTURE_STATE_SET_LABEL", {
    state: labelsMap[input.state] || l10n("FIELD_GROUND_STATE"),
  });
};

const fields = [
  {
    key: "state",
    label: l10n("FIELD_STATE"),
    type: "select",
    defaultValue: "ground",
    options: Object.entries(labelsMap),
  },
];

const compile = (input, helpers) => {
  const { _addComment, _setConstMemInt8 } = helpers;
  _addComment("Set ADVENTURE State");
  _setConstMemInt8(
    "adv_next_state",
    valuesMap[input.state] ?? "ADVENTURE_GROUND_STATE",
  );
};

module.exports = {
  id,
  description: l10n("EVENT_ADVENTURE_STATE_SET_DESC"),
  autoLabel,
  groups,
  subGroups,
  sceneTypes: ["ADVENTURE"],
  fields,
  compile,
  allowedBeforeInitFade: true,
};
