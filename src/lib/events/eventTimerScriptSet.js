const l10n = require("../helpers/l10n").default;

const id = "EVENT_SET_TIMER_SCRIPT";
const groups = ["EVENT_GROUP_TIMER"];

const fields = [
  {
    key: "duration",
    type: "number",
    label: l10n("FIELD_TIMER_DURATION"),
    min: 0.01,
    max: 60,
    step: 0.01,
    defaultValue: 10.0,
  },
  {
    key: "__scriptTabs",
    type: "tabs",
    defaultValue: "end",
    values: {
      end: l10n("FIELD_ON_TIMER_TICK"),
    },
  },
  {
    key: "script",
    label: l10n("FIELD_ON_TIMER_TICK"),
    type: "events",
    conditions: [
      {
        key: "__scriptTabs",
        in: [undefined, "end"],
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { timerScriptSet } = helpers;
  let duration = typeof input.duration === "number" ? input.duration : 10.0;
  timerScriptSet(duration, input.script);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
  allowChildrenBeforeInitFade: true,
};
