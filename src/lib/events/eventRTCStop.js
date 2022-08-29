const l10n = require("../helpers/l10n").default;

const id = "EVENT_RTC_STOP";
const groups = ["EVENT_GROUP_RTC"];

const fields = [
  {
    label: l10n("FIELD_RTC_STOP"),
  },
];

const compile = (input, helpers) => {
  const { rtcStop } = helpers;
  rtcStop();
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
