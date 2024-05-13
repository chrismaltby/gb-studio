const l10n = require("../helpers/l10n").default;

const id = "EVENT_SCRIPT_LOCK";
const groups = ["EVENT_GROUP_MISC"];

const fields = [
  {
    label: l10n("EVENT_SCRIPT_LOCK_DESC"),
  },
];

const compile = (input, helpers) => {
  const { lock } = helpers;
  lock();
};

module.exports = {
  id,
  description: l10n("EVENT_SCRIPT_LOCK_DESC"),
  groups,
  fields,
  compile,
};
