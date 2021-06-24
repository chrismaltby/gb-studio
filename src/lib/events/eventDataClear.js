const l10n = require("../helpers/l10n").default;

const id = "EVENT_CLEAR_DATA";
const group = "EVENT_GROUP_SAVE_DATA";

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
  group,
  fields,
  compile,
  allowedBeforeInitFade: true,
};
