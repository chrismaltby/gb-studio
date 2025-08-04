const l10n = require("../helpers/l10n").default;

const id = "EVENT_WAIT";
const groups = ["EVENT_GROUP_TIMER"];

const autoLabel = (fetchArg, input) => {
  if (input.units === "frames") {
    return l10n("EVENT_WAIT_LABEL", {
      time: fetchArg("frames"),
      units: l10n("FIELD_FRAMES"),
    });
  }
  return l10n("EVENT_WAIT_LABEL", {
    time: fetchArg("time"),
    units: l10n("FIELD_SECONDS"),
  });
};

const fields = [
  {
    key: "time",
    label: l10n("FIELD_DURATION"),
    description: l10n("FIELD_DURATION_WAIT_DESC"),
    type: "value",
    min: 0,
    max: 60,
    step: 0.1,
    unitsField: "units",
    unitsDefault: "time",
    unitsAllowed: ["time", "frames"],
    defaultValue: {
      type: "number",
      value: 0.5,
    },
    conditions: [
      {
        key: "units",
        ne: "frames",
      },
    ],
  },
  {
    key: "frames",
    label: l10n("FIELD_DURATION"),
    description: l10n("FIELD_DURATION_WAIT_DESC"),
    type: "value",
    min: 0,
    max: 3600,
    width: "50%",
    unitsField: "units",
    unitsDefault: "time",
    unitsAllowed: ["time", "frames"],
    defaultValue: {
      type: "number",
      value: 1,
    },
    conditions: [
      {
        key: "units",
        eq: "frames",
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { waitScriptValue } = helpers;
  const duration =
    input.units === "frames" ? (input.frames ?? 1) : (input.time ?? 0.5);
  waitScriptValue(duration, input.units ?? "time");
};

module.exports = {
  id,
  description: l10n("EVENT_WAIT_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
