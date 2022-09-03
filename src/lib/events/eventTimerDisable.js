const l10n = require("../helpers/l10n").default;

const id = "EVENT_TIMER_DISABLE";
const groups = ["EVENT_GROUP_TIMER"];

const fields = [
  {
    label: l10n("FIELD_TIMER_DISABLE"),
  },
];

const compile = (input, helpers) => {
  const { timerDisable } = helpers;
  timerDisable();
};

module.exports = {
  id,
  description: l10n("EVENT_TIMER_DISABLE_DESC"),
  groups,
  fields,
  compile,
};
