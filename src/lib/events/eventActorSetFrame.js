const l10n = require("../helpers/l10n");

const id = "EVENT_ACTOR_SET_FRAME";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "LAST_ACTOR"
  },
  {
    key: "frame",
    label: l10n("FIELD_ANIMATION_FRAME"),
    type: "number",
    min: 0,
    max: 25,
    defaultValue: 0
  }
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetFrame } = helpers;
  actorSetActive(input.actorId);
  actorSetFrame(input.frame);
};

module.exports = {
  id,
  fields,
  compile
};
