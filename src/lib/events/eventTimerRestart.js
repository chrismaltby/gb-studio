const l10n = require("../helpers/l10n");

const id = "EVENT_TIMER_RESTART";

const fields = [
  {
    label: l10n("FIELD_TIMER_RESTART")
  }
];

const compile = (input, helpers) => {
  const { timerRestart } = helpers;
  timerRestart();
};

module.exports = {
  id,
  fields,
  compile
};
