const l10n = require("../helpers/l10n").default;

const id = "EVENT_LINK_CLOSE";

const fields = [
  {
    label: l10n("FIELD_LINK_CLOSE"),
  },
];

const compile = (input, helpers) => {
  const { linkClose } = helpers;
  linkClose();
};

module.exports = {
  id,
  fields,
  compile,
};
