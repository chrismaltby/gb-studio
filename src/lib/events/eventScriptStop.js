const l10n = require("../helpers/l10n");

const id = "EVENT_STOP";

const fields = [
  {
    label: l10n("FIELD_STOP_SCRIPT")
  }
];

const compile = (input, helpers) => {
  const { scriptEnd } = helpers;
  scriptEnd();
};

module.exports = {
  id,
  fields,
  compile
};
