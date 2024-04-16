const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_PUSH";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_MOVEMENT",
};

const fields = [
  {
    key: "continue",
    label: l10n("FIELD_SLIDE_UNTIL_COLLISION"),
    description: l10n("FIELD_SLIDE_UNTIL_COLLISION_DESC"),
    type: "checkbox",
    defaultValue: false,
  },
];

const compile = (input, helpers) => {
  const { entityType, entity, actorSetActive, actorPush } = helpers;
  if (entityType === "actor" && entity.id !== undefined) {
    actorSetActive(entity.id);
    actorPush(input.continue);
  }
};

module.exports = {
  id,
  description: l10n("EVENT_ACTOR_PUSH_DESC"),
  groups,
  subGroups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
