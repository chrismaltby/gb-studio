const l10n = require("../helpers/l10n").default;

const id = "EVENT_RTC_SET_ALL";
const groups = ["EVENT_GROUP_RTC"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_RTC_SET_ALL_LABEL", {
    days: fetchArg("days"),
    hours: fetchArg("hours"),
    minutes: fetchArg("minutes"),
    seconds: fetchArg("seconds"),
  });
};

const fields = [
  {
    key: "days",
    label: l10n("FIELD_DAYS"),
    type: "union",
    types: ["number", "variable"],
    defaultType: "number",
    min: 0,
    max: 512,
    width: "50%",
    defaultValue: {
      number: 0,
      variable: "LAST_VARIABLE",
    },
  },
  {
    key: "hours",
    label: l10n("FIELD_HOURS"),
    type: "union",
    types: ["number", "variable"],
    defaultType: "number",
    min: 0,
    max: 23,
    width: "50%",
    defaultValue: {
      number: 0,
      variable: "LAST_VARIABLE",
    },
  },
  {
    key: "minutes",
    label: l10n("FIELD_MINUTES"),
    type: "union",
    types: ["number", "variable"],
    defaultType: "number",
    min: 0,
    max: 59,
    width: "50%",
    defaultValue: {
      number: 0,
      variable: "LAST_VARIABLE",
    },
  },
  {
    key: "seconds",
    label: l10n("FIELD_SECONDS"),
    type: "union",
    types: ["number", "variable"],
    defaultType: "number",
    min: 0,
    max: 59,
    width: "50%",
    defaultValue: {
      number: 0,
      variable: "LAST_VARIABLE",
    },
  },
];

const compile = (input, helpers) => {
  const { rtcSet, rtcSetToVariable, getVariableAlias } = helpers;

  if (input.days.type === "number") {
    rtcSet(input.days.value, ".RTC_DAYS");
  } else{
    const days = getVariableAlias(input.days.value);
    rtcSetToVariable(days, ".RTC_DAYS");
  }

  if (input.hours.type === "number") {
    rtcSet(input.hours.value, ".RTC_HOURS");
  } else{
    const hours = getVariableAlias(input.hours.value);
    rtcSetToVariable(hours, ".RTC_HOURS");
  }

  if (input.minutes.type === "number") {
    rtcSet(input.minutes.value, ".RTC_MINUTES");
  } else{
    const minutes = getVariableAlias(input.minutes.value);
    rtcSetToVariable(minutes, ".RTC_MINUTES");
  }

  if (input.seconds.type === "number") {
    rtcSet(input.seconds.value, ".RTC_SECONDS");
  } else{
    const seconds = getVariableAlias(input.seconds.value);
    rtcSetToVariable(seconds, ".RTC_SECONDS");
  }
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};
