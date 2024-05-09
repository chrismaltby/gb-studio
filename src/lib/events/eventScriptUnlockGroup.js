const l10n = require("../helpers/l10n").default;

const id = "EVENT_SCRIPT_UNLOCK_GROUP";
const groups = ["EVENT_GROUP_MISC"];

const fields = [
  {
    key: "true",
    type: "events",
    label: l10n("FIELD_UNLOCKED"),
    description: l10n("EVENT_SCRIPT_UNLOCK_DESC"),
  },
];

const compile = (input, helpers) => {
  const { unlock, popLockState, compileEvents } = helpers;
  unlock();
  compileEvents(input.true);
  popLockState();
};

module.exports = {
  id,
  description: l10n("EVENT_SCRIPT_UNLOCK_DESC"),
  groups,
  fields,
  compile,
};
