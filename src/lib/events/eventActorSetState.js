const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SET_STATE";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_PROPERTIES",
};

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_SET_STATE_LABEL", {
    actor: fetchArg("actorId"),
    state: fetchArg("spriteStateId") || l10n("FIELD_DEFAULT"),
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
    key: "spriteStateId",
    label: l10n("FIELD_ANIMATION_STATE"),
    description: l10n("FIELD_ANIMATION_STATE_DESC"),
    type: "animationstate",
    defaultValue: "",
    width: "50%",
  },
  {
    key: "loopAnim",
    label: l10n("FIELD_LOOP_ANIMATION"),
    description: l10n("FIELD_LOOP_ANIMATION_DESC"),
    type: "checkbox",
    defaultValue: true,
    width: "50%",
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetState } = helpers;
  actorSetActive(input.actorId);
  actorSetState(input.spriteStateId, input.loopAnim);
};

module.exports = {
  id,
  description: l10n("EVENT_ACTOR_SET_STATE_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
};
