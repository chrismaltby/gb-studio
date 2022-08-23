const l10n = require("../helpers/l10n").default;

const id = "EVENT_RUMBLE_OFF";
const groups = ["EVENT_GROUP_RUMBLE"];

const fields = [
  {
    label: l10n("FIELD_RUMBLE_OFF"),
  },
];

const compile = (input, helpers) => {
  const { rumbleOff } = helpers;
  rumbleOff();
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
