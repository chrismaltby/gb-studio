const l10n = require("../helpers/l10n").default;

const id = "EVENT_SET_ADVENTURE_CALLBACK_SCRIPT";
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
  return l10n("EVENT_SET_ADVENTURE_CALLBACK_SCRIPT_LABEL", {
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
  {
    key: "__scriptTabs",
    type: "tabs",
    defaultValue: "scriptinput",
    values: {
      scriptinput: l10n("FIELD_ON_STATE"),
    },
  },
  {
    key: "script",
    label: l10n("FIELD_ON_STATE"),
    description: l10n("FIELD_ON_STATE"),
    type: "events",
    allowedContexts: ["global", "entity"],
    conditions: [
      {
        key: "__scriptTabs",
        in: [undefined, "scriptinput"],
      },
    ],
  },
];

const compile = (input, helpers) => {
  const {
    _compileSubScript,
    _addComment,
    _callNative,
    _stackPushConst,
    _stackPop,
  } = helpers;

  const callbackLabel = valuesMap[input.event] ?? valuesMap.groundStart;

  const scriptRef = _compileSubScript(
    "state",
    input.script,
    "adv_callback_" + callbackLabel,
  );

  const bank = `___bank_${scriptRef}`;
  const ptr = `_${scriptRef}`;

  _addComment("Set Adventure Script");
  _stackPushConst(callbackLabel);
  _stackPushConst(bank);
  _stackPushConst(ptr);
  _callNative("adv_callback_attach");
  _stackPop(3);
};

module.exports = {
  id,
  description: l10n("EVENT_SET_ADVENTURE_CALLBACK_SCRIPT_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
  allowedBeforeInitFade: true,
};
