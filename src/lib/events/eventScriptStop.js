const l10n = require("../helpers/l10n").default;

const id = "EVENT_STOP";
const groups = ["EVENT_GROUP_CONTROL_FLOW"];

const fields = [
  {
    label: l10n("FIELD_STOP_SCRIPT"),
  },
];

const compile = (input, helpers) => {
  const { scriptEnd } = helpers;
  scriptEnd();
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
