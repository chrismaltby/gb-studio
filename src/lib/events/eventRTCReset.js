const l10n = require("../helpers/l10n").default;

const id = "EVENT_RTC_RESET";
const groups = ["EVENT_GROUP_RTC"];

const fields = [
  {
    label: l10n("FIELD_RTC_RESET"),
  },
];

const compile = (input, helpers) => {
  const { rtcSet } = helpers;

  rtcSet(0, ".RTC_DAYS");
  rtcSet(0, ".RTC_HOURS");
  rtcSet(0, ".RTC_MINUTES");
  rtcSet(0, ".RTC_SECONDS");
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
