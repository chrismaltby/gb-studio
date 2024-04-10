const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SET_SPRITE";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_PROPERTIES",
};

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_SET_SPRITE_LABEL", {
    actor: fetchArg("actorId"),
    spriteSheet: fetchArg("spriteSheetId"),
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
    key: "spriteSheetId",
    label: l10n("FIELD_SPRITE_SHEET"),
    description: l10n("FIELD_SPRITE_SHEET_ACTOR_DESC"),
    type: "sprite",
    defaultValue: "LAST_SPRITE",
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetSprite } = helpers;
  actorSetActive(input.actorId);
  actorSetSprite(input.spriteSheetId);
};

module.exports = {
  id,
  description: l10n("EVENT_ACTOR_SET_SPRITE_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
};
