const l10n = require("../helpers/l10n").default;

const id = "EVENT_RTC_GET";
const groups = ["EVENT_GROUP_RTC"];

const fields = [
  {
    key: "time",
    label: l10n("FIELD_TIME"),
    type: "time",
    defaultValue: ".RTC_DAYS",
  },
  {
    key: "variable",
    label: l10n("FIELD_VARIABLE"),
    type: "variable",
    width: "50%",
    defaultValue: "LAST_VARIABLE",
  },
];

const compile = (input, helpers) => {
  const { rtcGet, getVariableAlias } = helpers;
  const variable = getVariableAlias(input.variable);
  rtcGet(variable, input.time);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
