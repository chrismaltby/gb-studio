const l10n = require("../helpers/l10n");

const id = "EVENT_SET_TIMER_SCRIPT";

const fields = [
  {
    label: l10n("FIELD_SET_TIMER")
  },
  {
    key: "duration",
    type: "number",
    label: l10n("FIELD_TIMER_DURATION"),
    min: 0.25,
    max: 60,
    step: 0.25,
    defaultValue: 10.0
  },
  {
    key: "script",
    type: "events"
  }
];

const compile = (input, helpers) => {
  const { timerScriptSet } = helpers;
  let duration = (typeof input.duration === "number") ? input.duration : 10.0;
  timerScriptSet(duration, input.script);
};

module.exports = {
  id,
  fields,
  compile
};
