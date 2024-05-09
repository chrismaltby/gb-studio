const l10n = require("../helpers/l10n").default;

const id = "EVENT_SCRIPT_LOCK_GROUP";
const groups = ["EVENT_GROUP_MISC"];

const fields = [
  {
    key: "true",
    type: "events",
    label: l10n("FIELD_LOCKED"),
    description: l10n("EVENT_SCRIPT_LOCK_DESC"),
  },
];

const compile = (input, helpers) => {
  const { lock, popLockState, compileEvents } = helpers;
  lock();
  compileEvents(input.true);
  popLockState();
};

module.exports = {
  id,
  description: l10n("EVENT_SCRIPT_LOCK_DESC"),
  groups,
  fields,
  compile,
};
