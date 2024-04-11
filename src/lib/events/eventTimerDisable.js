const l10n = require("../helpers/l10n").default;

const id = "EVENT_TIMER_DISABLE";
const groups = ["EVENT_GROUP_TIMER"];
const subGroups = {
  EVENT_GROUP_TIMER: "EVENT_GROUP_SCRIPT",
};

const autoLabel = (fetchArg) => {
  return l10n("EVENT_TIMER_DISABLE_LABEL", {
    timer: fetchArg("timer"),
  });
};

const fields = [
  {
    key: "timer",
    label: l10n("FIELD_TIMER"),
    description: l10n("FIELD_TIMER_DESC"),
    type: "togglebuttons",
    options: [
      [1, "1", `${l10n("FIELD_TIMER")} 1`],
      [2, "2", `${l10n("FIELD_TIMER")} 2`],
      [3, "3", `${l10n("FIELD_TIMER")} 3`],
      [4, "4", `${l10n("FIELD_TIMER")} 4`],
    ],
    allowNone: false,
    defaultValue: 1,
    flexBasis: "100%",
  },
  {
    label: l10n("FIELD_TIMER_DISABLE"),
  },
];

const compile = (input, helpers) => {
  const { timerDisable } = helpers;
  timerDisable(input.timer);
};

module.exports = {
  id,
  autoLabel,
  description: l10n("EVENT_TIMER_DISABLE_DESC"),
  groups,
  subGroups,
  fields,
  compile,
};
