const l10n = require("../helpers/l10n").default;

const id = "EVENT_WEAPON_ATTACK";

const fields = [
  {
    key: "spriteSheetId",
    type: "sprite",
    label: l10n("FIELD_SPRITE_SHEET"),
    defaultValue: "LAST_SPRITE",
  },
  {
    key: "actorId",
    type: "actor",
    label: l10n("FIELD_SOURCE"),
    defaultValue: "$self$",
  },  
  {
    key: "collisionGroup",
    label: l10n("FIELD_COLLISION_GROUP"),
    type: "collisionMask",
    width: "50%",    
    includePlayer: false,
    defaultValue: "3"
  },
  {
    key: "collisionMask",
    label: l10n("FIELD_COLLIDE_WITH"),
    type: "collisionMask",
    width: "50%",    
    includePlayer: true,
    defaultValue: ["1"]
  }    
];

const compile = (input, helpers) => {
  const { weaponAttack, actorSetActive } = helpers;
  actorSetActive(input.actorId);
  weaponAttack(input.spriteSheetId, input.collisionGroup, input.collisionMask);
};

module.exports = {
  id,
  fields,
  compile
};
