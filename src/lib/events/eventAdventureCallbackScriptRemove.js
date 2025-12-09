const l10n = require("../helpers/l10n").default;

const id = "EVENT_REMOVE_ADVENTURE_CALLBACK_SCRIPT";
const groups = ["EVENT_GROUP_ENGINE_FIELDS"];
const subGroups = {
  EVENT_GROUP_ENGINE_FIELDS: "GAMETYPE_ADVENTURE",
};

const labelsMap = {
  groundStart: l10n("FIELD_GROUND_START"),
  groundEnd: l10n("FIELD_GROUND_END"),
  dashStart: l10n("FIELD_DASH_START"),
  dashReady: l10n("FIELD_DASH_READY"),
  dashEnd: l10n("FIELD_DASH_END"),
  knockbackStart: l10n("FIELD_KNOCKBACK_START"),
  knockbackEnd: l10n("FIELD_KNOCKBACK_END"),
  blankStart: l10n("FIELD_BLANK_START"),
  blankEnd: l10n("FIELD_BLANK_END"),
  runStart: l10n("FIELD_RUN_START"),
  runEnd: l10n("FIELD_RUN_END"),
  pushStart: l10n("FIELD_PUSH_START"),
  pushEnd: l10n("FIELD_PUSH_END"),
};

const valuesMap = {
  groundStart: "ADVENTURE_GROUND_INIT",
  groundEnd: "ADVENTURE_GROUND_END",
  dashStart: "ADVENTURE_DASH_INIT",
  dashReady: "ADVENTURE_DASH_READY",
  dashEnd: "ADVENTURE_DASH_END",
  knockbackStart: "ADVENTURE_KNOCKBACK_INIT",
  knockbackEnd: "ADVENTURE_KNOCKBACK_END",
  blankStart: "ADVENTURE_BLANK_INIT",
  blankEnd: "ADVENTURE_BLANK_END",
  runStart: "ADVENTURE_RUN_INIT",
  runEnd: "ADVENTURE_RUN_END",
  pushStart: "ADVENTURE_PUSH_INIT",
  pushEnd: "ADVENTURE_PUSH_END",
};

const autoLabel = (_, input) => {
  return l10n("EVENT_REMOVE_ADVENTURE_CALLBACK_SCRIPT_LABEL", {
    event: labelsMap[input.event] || l10n("FIELD_GROUND_START"),
  });
};

const fields = [
  {
    key: "event",
    label: l10n("FIELD_EVENT"),
    type: "select",
    defaultValue: "groundStart",
    options: Object.entries(labelsMap),
  },
];

const compile = (input, helpers) => {
  const { _addComment, _stackPushConst, _callNative, _stackPop } = helpers;

  const callbackLabel = valuesMap[input.event] ?? valuesMap.groundStart;

  _addComment("Remove Adventure State Script");
  _stackPushConst(callbackLabel);
  _callNative("adv_callback_detach");
  _stackPop(1);
};

module.exports = {
  id,
  description: l10n("EVENT_REMOVE_ADVENTURE_CALLBACK_SCRIPT_DESC"),
  autoLabel,
  groups,
  subGroups,
  sceneTypes: ["ADVENTURE"],
  fields,
  compile,
  allowedBeforeInitFade: true,
};
