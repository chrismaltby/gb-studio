const l10n = require("../helpers/l10n").default;

const id = "EVENT_RTC_START";
const groups = ["EVENT_GROUP_RTC"];

const fields = [
  {
    label: l10n("FIELD_RTC_START"),
  },
];

const compile = (input, helpers) => {
  const { rtcStart } = helpers;
  rtcStart();
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
