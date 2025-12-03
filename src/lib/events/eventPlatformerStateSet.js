const l10n = require("../helpers/l10n").default;

const id = "EVENT_PLATFORMER_STATE_SET";
const groups = ["EVENT_GROUP_ENGINE_FIELDS"];
const subGroups = {
  EVENT_GROUP_ENGINE_FIELDS: "GAMETYPE_PLATFORMER",
};

const labelsMap = {
  fall: l10n("FIELD_FALL_STATE"),
  ground: l10n("FIELD_GROUND_STATE"),
  jump: l10n("FIELD_JUMP_STATE"),
  dash: l10n("FIELD_DASH_STATE"),
  ladder: l10n("FIELD_LADDER_STATE"),
  wall: l10n("FIELD_WALL_STATE"),
  knockback: l10n("FIELD_KNOCKBACK_STATE"),
  blank: l10n("FIELD_BLANK_STATE"),
  run: l10n("FIELD_RUN_STATE"),
  float: l10n("FIELD_FLOAT_STATE"),
};

const valuesMap = {
  fall: "PLATFORM_FALL_STATE",
  ground: "PLATFORM_GROUND_STATE",
  jump: "PLATFORM_JUMP_STATE",
  dash: "PLATFORM_DASH_STATE",
  ladder: "PLATFORM_LADDER_STATE",
  wall: "PLATFORM_WALL_STATE",
  knockback: "PLATFORM_KNOCKBACK_STATE",
  blank: "PLATFORM_BLANK_STATE",
  run: "PLATFORM_RUN_STATE",
  float: "PLATFORM_FLOAT_STATE",
};

const autoLabel = (_, input) => {
  return l10n("EVENT_PLATFORMER_STATE_SET_LABEL", {
    state: labelsMap[input.state] || l10n("FIELD_FALL_STATE"),
  });
};

const fields = [
  {
    key: "state",
    label: l10n("FIELD_STATE"),
    type: "select",
    defaultValue: "fall",
    options: Object.entries(labelsMap),
  },
];

const compile = (input, helpers) => {
  const { _addComment, _setConstMemInt8 } = helpers;
  _addComment("Set Platformer State");
  _setConstMemInt8(
    "plat_next_state",
    valuesMap[input.state] ?? "PLATFORM_FALL_STATE",
  );
};

module.exports = {
  id,
  description: l10n("EVENT_PLATFORMER_STATE_SET_DESC"),
  autoLabel,
  groups,
  subGroups,
  sceneTypes: ["PLATFORM"],
  fields,
  compile,
  allowedBeforeInitFade: true,
};
