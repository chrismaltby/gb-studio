const l10n = require("../helpers/l10n").default;

const id = "EVENT_WAIT";
const groups = ["EVENT_GROUP_TIMER"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_WAIT_LABEL", { time: fetchArg("time") });
};

const fields = [
  {
    key: "time",
    type: "number",
    label: l10n("FIELD_SECONDS"),
    min: 0,
    max: 10,
    step: 0.1,
    defaultValue: 0.5,
  },
];

const compile = (input, helpers) => {
  const { wait } = helpers;
  let seconds = typeof input.time === "number" ? input.time : 0.5;
  // Convert seconds into frames (60fps)
  while (seconds > 0) {
    const time = Math.min(seconds, 1);
    wait(Math.ceil(60 * time));
    seconds -= time;
  }
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};
