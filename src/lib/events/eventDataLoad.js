const l10n = require("../helpers/l10n").default;

const id = "EVENT_LOAD_DATA";
const group = "EVENT_GROUP_SAVE_DATA";

const fields = [
  {
    label: l10n("FIELD_LOAD_DATA"),
  },
];

const compile = (input, helpers) => {
  const { dataLoad } = helpers;
  dataLoad(0);
};

module.exports = {
  id,
  group,
  fields,
  compile,
};
