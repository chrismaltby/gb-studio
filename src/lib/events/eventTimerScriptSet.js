import l10n from "../helpers/l10n";

export const id = "EVENT_SET_TIMER_SCRIPT";

export const fields = [
  {
    label: l10n("FIELD_SET_TIMER")
  },
  {
    key: "duration",
    type: "number",
    label: l10n("FIELD_TIMER_DURATION"),
    min: 0.50,
    max: 60,
    step: 0.05,
    defaultValue: 10.0
  },
  {
    key: "script",
    type: "events"
  }
];

export const compile = (input, helpers) => {
  const { timerScriptSet } = helpers;
  let duration = (typeof input.duration === "number") ? input.duration : 10.0;
  timerScriptSet(duration, input.script);
};
