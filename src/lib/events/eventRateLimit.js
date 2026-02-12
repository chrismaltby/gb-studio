const l10n = require("../helpers/l10n").default;

const id = "EVENT_RATE_LIMIT";
const groups = ["EVENT_GROUP_TIMER"];

const autoLabel = (fetchArg, input) => {
  if (input.units === "frames") {
    return l10n("EVENT_RATE_LIMIT_LABEL", {
      time: fetchArg("frames"),
      units: l10n("FIELD_FRAMES"),
    });
  }
  return l10n("EVENT_RATE_LIMIT_LABEL", {
    time: fetchArg("time"),
    units: l10n("FIELD_SECONDS"),
  });
};

const fields = [
  {
    key: "variable",
    label: l10n("FIELD_RATE_LIMIT_VARIABLE"),
    description: l10n("FIELD_RATE_LIMIT_VARIABLE_DESC"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "time",
    label: l10n("FIELD_TIME_INTERVAL"),
    description: l10n("FIELD_RATE_LIMIT_INTERVAL_DESC"),
    type: "constvalue",
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
    label: l10n("FIELD_TIME_INTERVAL"),
    description: l10n("FIELD_RATE_LIMIT_INTERVAL_DESC"),
    type: "constvalue",
    min: 0,
    max: 3600,
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
  {
    key: "true",
    label: l10n("FIELD_RATE_LIMITED"),
    description: l10n("FIELD_RATE_LIMITED_DESC"),
    type: "events",
  },
];

const compile = (input, helpers) => {
  const { rateLimitConstValue } = helpers;
  rateLimitConstValue(
    input.units === "frames" ? input.frames : input.time,
    input.units ?? "time",
    input.variable,
    input.true,
  );
};

module.exports = {
  id,
  description: l10n("EVENT_RATE_LIMIT_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
