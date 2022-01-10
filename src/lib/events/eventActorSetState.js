const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SET_STATE";
const groups = ["EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_SET_STATE_LABEL", {
    actor: fetchArg("actorId"),
    state: fetchArg("spriteStateId") || l10n("FIELD_DEFAULT"),
  });
};

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "spriteStateId",
    type: "animationstate",
    defaultValue: "",
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetState } = helpers;
  actorSetActive(input.actorId);
  actorSetState(input.spriteStateId);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};
