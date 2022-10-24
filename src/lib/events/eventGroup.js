const l10n = require("../helpers/l10n").default;

const id = "EVENT_GROUP";
const groups = ["EVENT_GROUP_MISC"];

const fields = [
  {
    key: "true",
    type: "events",
  },
];

const compile = (input, helpers) => {
  const { compileEvents } = helpers;
  compileEvents(input.true);
};

module.exports = {
  id,
  description: l10n("EVENT_GROUP_DESC"),
  groups,
  fields,
  compile,
};
