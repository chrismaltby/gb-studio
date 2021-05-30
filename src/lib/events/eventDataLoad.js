const l10n = require("../helpers/l10n").default;

const id = "EVENT_LOAD_DATA";

const fields = [
  {
    label: l10n("FIELD_LOAD_DATA")
  }
];

const compile = (input, helpers) => {
  const { dataLoad } = helpers;
  dataLoad();
};

module.exports = {
  id,
  fields,
  compile
};
