const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_STOP_UPDATE";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_SCRIPT",
};

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_STOP_UPDATE_LABEL", {
    actor: fetchArg("actorId"),
  });
};

const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: l10n("FIELD_ACTOR_UPDATE_DESC"),
    type: "actor",
    defaultValue: "$self$",
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorStopUpdate } = helpers;
  actorSetActive(input.actorId);
  actorStopUpdate();
};

module.exports = {
  id,
  description: l10n("EVENT_ACTOR_STOP_UPDATE_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
};
