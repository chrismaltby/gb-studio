const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_INVOKE";
const groups = ["EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_INVOKE_LABEL", {
    actor: fetchArg("actorId"),
  });
};

const fields = [
  {
    key: "actorId",
    label: l10n("FIELD_ACTOR_INVOKE"),
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
  autoLabel,
  groups,
  fields,
  compile,
  deprecated: true,
};
