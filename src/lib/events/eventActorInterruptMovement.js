const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_INTERRUPT_MOVEMENT";
const groups = ["EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_INTERRUPT_MOVEMENT_LABEL", {
    actor: fetchArg("actorId"),
  });
};

const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    type: "actor",
    defaultValue: "$self$",
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorInterruptMovement } = helpers;
  actorSetActive(input.actorId);
  actorInterruptMovement();
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};
