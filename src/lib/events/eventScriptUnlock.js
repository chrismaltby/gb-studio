const l10n = require("../helpers/l10n").default;

const id = "EVENT_SCRIPT_UNLOCK";
const groups = ["EVENT_GROUP_MISC"];

const fields = [
  {
    label: l10n("EVENT_SCRIPT_UNLOCK_DESC"),
  },
];

const compile = (input, helpers) => {
  const { unlock } = helpers;
  unlock();
};

module.exports = {
  id,
  description: l10n("EVENT_SCRIPT_UNLOCK_DESC"),
  groups,
  fields,
  compile,
};
