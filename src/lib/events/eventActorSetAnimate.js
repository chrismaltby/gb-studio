const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SET_ANIMATE";
const groups = ["EVENT_GROUP_ACTOR"];

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "animate",
    type: "checkbox",
    label: l10n("FIELD_ANIMATE_WHEN_STATIONARY"),
    defaultValue: true,
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetAnimate } = helpers;
  actorSetActive(input.actorId);
  actorSetAnimate(input.animate);
};

module.exports = {
  id,
  deprecated: true,
  groups,
  fields,
  compile,
};
