const l10n = require("../helpers/l10n").default;

const id = "EVENT_RTC_GET_ALL";
const groups = ["EVENT_GROUP_RTC"];

const fields = [
  {
    key: "days",
    label: l10n("FIELD_DAYS"),
    type: "variable",
    width: "50%",
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "hours",
    label: l10n("FIELD_HOURS"),
    type: "variable",
    width: "50%",
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "minutes",
    label: l10n("FIELD_MINUTES"),
    type: "variable",
    width: "50%",
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "seconds",
    label: l10n("FIELD_SECONDS"),
    type: "variable",
    width: "50%",
    defaultValue: "LAST_VARIABLE",
  },
];

const compile = (input, helpers) => {
  const { rtcGetAll, getVariableAlias } = helpers;
  const days = getVariableAlias(input.days);
  const hours = getVariableAlias(input.hours);
  const minutes = getVariableAlias(input.minutes);
  const seconds = getVariableAlias(input.seconds);
  rtcGetAll(days, hours, minutes, seconds);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
