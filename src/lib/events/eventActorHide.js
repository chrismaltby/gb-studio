const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_HIDE";
const groups = ["EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_HIDE_LABEL", {
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
  const { actorHide } = helpers;
  actorHide(input.actorId);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};
