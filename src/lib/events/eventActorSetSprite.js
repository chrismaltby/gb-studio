const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SET_SPRITE";
const groups = ["EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_SET_SPRITE_LABEL", {
    actor: fetchArg("actorId"),
    spriteSheet: fetchArg("spriteSheetId"),
  });
};

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "spriteSheetId",
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
  autoLabel,
  groups,
  fields,
  compile,
};
