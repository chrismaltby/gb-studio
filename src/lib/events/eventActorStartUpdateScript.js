const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_START_UPDATE";
const groups = ["EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_START_UPDATE_LABEL", {
    actor: fetchArg("actorId"),
  });
};

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorStartUpdate } = helpers;
  actorSetActive(input.actorId);
  actorStartUpdate();
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};
