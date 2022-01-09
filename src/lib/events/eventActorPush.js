const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_PUSH";
const groups = ["EVENT_GROUP_ACTOR"];

const fields = [
  {
    key: "continue",
    label: l10n("FIELD_SLIDE_UNTIL_COLLISION"),
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
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
