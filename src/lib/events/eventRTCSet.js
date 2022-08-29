const l10n = require("../helpers/l10n").default;

const id = "EVENT_RTC_SET";
const groups = ["EVENT_GROUP_RTC"];

const autoLabel = (fetchArg) => {
  const timeLookup = {
    ".RTC_DAYS": "Days",
    ".RTC_HOURS": "Hours",
    ".RTC_MINUTES": "Minutes",
    ".RTC_SECONDS": "Seconds",
  };
  return l10n("EVENT_RTC_SET_LABEL", {
    unit: timeLookup[fetchArg("time")],
    value: fetchArg("val"),
  });
};

const fields = [
  {
    key: "time",
    label: l10n("FIELD_TIME"),
    type: "time",
    width: "50%",
    defaultValue: ".RTC_DAYS",
  },
  {
    key: "val",
    label: l10n("FIELD_VALUE"),
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
    conditions: [
      {
        key: "time",
        eq: ".RTC_DAYS",
      },
    ],
  },
  {
    key: "val",
    label: l10n("FIELD_VALUE"),
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
    conditions: [
      {
        key: "time",
        eq: ".RTC_HOURS",
      },
    ],
  },
  {
    key: "val",
    label: l10n("FIELD_VALUE"),
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
    conditions: [
      {
        key: "time",
        eq: ".RTC_MINUTES",
      },
    ],
  },
  {
    key: "val",
    label: l10n("FIELD_VALUE"),
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
    conditions: [
      {
        key: "time",
        eq: ".RTC_SECONDS",
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { rtcSet, rtcSetToVariable, getVariableAlias } = helpers;

  if (input.val.type === "number") {
    rtcSet(input.val.value, input.time);
  } else{
    const variable = getVariableAlias(input.val.value);
    rtcSetToVariable(variable, input.time);
  }
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};
