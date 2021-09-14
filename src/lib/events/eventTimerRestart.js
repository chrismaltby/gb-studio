const l10n = require("../helpers/l10n").default;

const id = "EVENT_TIMER_RESTART";
const groups = ["EVENT_GROUP_TIMER"];

const fields = [
  {
    label: l10n("FIELD_TIMER_RESTART"),
  },
];

const compile = (input, helpers) => {
  const { timerRestart } = helpers;
  timerRestart();
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
