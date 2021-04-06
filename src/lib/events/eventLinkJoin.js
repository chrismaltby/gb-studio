const l10n = require("../helpers/l10n").default;

const id = "EVENT_LINK_JOIN";

const fields = [
  {
    label: l10n("FIELD_LINK_JOIN"),
  },
];

const compile = (input, helpers) => {
  const { linkJoin } = helpers;
  linkJoin();
};

module.exports = {
  id,
  fields,
  compile,
};
