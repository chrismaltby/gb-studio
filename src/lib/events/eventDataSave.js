const l10n = require("../helpers/l10n").default;

const id = "EVENT_SAVE_DATA";

const fields = [
  {
    label: l10n("FIELD_SAVE_DATA")
  }
];

const compile = (input, helpers) => {
  const { dataSave } = helpers;
  dataSave();
};

module.exports = {
  id,
  fields,
  compile
};
