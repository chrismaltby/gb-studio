const l10n = require("../helpers/l10n").default;

const id = "EVENT_TIMER_DISABLE";

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
  fields,
  compile,
};
