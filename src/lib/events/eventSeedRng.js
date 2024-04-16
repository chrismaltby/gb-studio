const l10n = require("../helpers/l10n").default;

const id = "EVENT_RNG_SEED";
const groups = ["EVENT_GROUP_MATH", "EVENT_GROUP_VARIABLES"];
const subGroups = {
  EVENT_GROUP_MATH: "EVENT_GROUP_RANDOM",
  EVENT_GROUP_VARIABLES: "EVENT_GROUP_RANDOM",
};

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
  subGroups,
  fields,
  compile,
};
