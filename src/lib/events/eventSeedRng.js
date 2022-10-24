const l10n = require("../helpers/l10n").default;

const id = "EVENT_RNG_SEED";
const groups = ["EVENT_GROUP_MATH", "EVENT_GROUP_VARIABLES"];

const fields = [
  {
    label: l10n("FIELD_RNG_SEED_DESCRIPTION"),
  },
];

const compile = (input, helpers) => {
  const { seedRng } = helpers;
  seedRng();
};

module.exports = {
  id,
  description: l10n("EVENT_RNG_SEED_DESC"),
  groups,
  fields,
  compile,
};
