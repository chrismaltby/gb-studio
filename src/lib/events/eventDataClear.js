const l10n = require("../helpers/l10n").default;

const id = "EVENT_CLEAR_DATA";

const fields = [
  {
    label: l10n("FIELD_CLEAR_DATA"),
  },
];

const compile = (input, helpers) => {
  const { dataClear } = helpers;
  dataClear(0);
};

module.exports = {
  id,
  fields,
  compile,
};
