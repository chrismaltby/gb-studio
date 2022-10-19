const l10n = require("../helpers/l10n").default;

const id = "EVENT_IDLE";
const groups = ["EVENT_GROUP_TIMER"];

const fields = [
  {
    label: l10n("FIELD_IDLE_LABEL"),
  },
];

const compile = (input, helpers) => {
  const { idle } = helpers;
  idle();
};

module.exports = {
  id,
  description: l10n("EVENT_IDLE_DESC"),
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
