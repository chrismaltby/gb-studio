const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_MOVE_CANCEL";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_MOVEMENT",
};

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_MOVE_CANCEL_LABEL", {
    actor: fetchArg("actorId"),
  });
};

const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: l10n("FIELD_ACTOR_MOVE_CANCEL_DESC"),
    type: "actor",
    defaultValue: "$self$",
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorMoveCancel } = helpers;
  actorSetActive(input.actorId);
  actorMoveCancel();
};

module.exports = {
  id,
  description: l10n("EVENT_ACTOR_MOVE_CANCEL_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
};
