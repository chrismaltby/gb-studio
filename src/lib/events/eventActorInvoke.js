const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_INVOKE";
const groups = ["EVENT_GROUP_ACTOR"];

const fields = [
  {
    label: l10n("FIELD_ACTOR_INVOKE"),
  },
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorInvoke } = helpers;
  actorSetActive(input.actorId);
  actorInvoke();
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
