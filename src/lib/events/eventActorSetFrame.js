const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SET_FRAME";
const groups = ["EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_SET_FRAME_LABEL", {
    actor: fetchArg("actorId"),
    frame: fetchArg("frame"),
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
  {
    key: "frame",
    label: l10n("FIELD_ANIMATION_FRAME"),
    description: l10n("FIELD_ANIMATION_FRAME_DESC"),
    type: "value",
    min: 0,
    max: 25,
    defaultValue: {
      type: "number",
      value: 0,
    },
  },
];

const compile = (input, helpers) => {
  const { actorSetFrameToScriptValue } = helpers;
  actorSetFrameToScriptValue(input.actorId, input.frame);
};

module.exports = {
  id,
  description: l10n("EVENT_ACTOR_SET_FRAME_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
};
