const l10n = require("../helpers/l10n");

const id = "EVENT_CLEAR_DATA";

const fields = [
  {
    label: l10n("FIELD_CLEAR_DATA")
  }
];

const compile = (input, helpers) => {
  const { dataClear } = helpers;
  dataClear();
};

module.exports = {
  id,
  fields,
  compile
};
