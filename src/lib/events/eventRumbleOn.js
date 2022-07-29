const l10n = require("../helpers/l10n").default;

const id = "EVENT_RUMBLE_ON";
const groups = ["EVENT_GROUP_RUMBLE"];

const fields = [
  {
    label: l10n("FIELD_RUMBLE_ON"),
  },
];

const compile = (input, helpers) => {
  const { rumbleOn } = helpers;
  rumbleOn();
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
