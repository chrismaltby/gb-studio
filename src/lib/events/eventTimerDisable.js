const l10n = require("../helpers/l10n").default;

const id = "EVENT_TIMER_DISABLE";
const groups = ["EVENT_GROUP_TIMER"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_TIMER_DISABLE_LABEL", {
    timer: fetchArg("timer"),
  });
};

const fields = [
  {
    label: l10n("FIELD_TIMER_DISABLE"),
  },
  {
    key: "timer",
    label: l10n("FIELD_TIMER"),
    type: "select",
    options: [
      [1, `${l10n("FIELD_TIMER")} 1`],
      [2, `${l10n("FIELD_TIMER")} 2`],
      [3, `${l10n("FIELD_TIMER")} 3`],
      [4, `${l10n("FIELD_TIMER")} 4`],
    ],
    defaultValue: 1
  },
];

const compile = (input, helpers) => {
  const { timerDisable } = helpers;
  timerDisable(input.timer);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};
