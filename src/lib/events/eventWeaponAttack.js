const l10n = require("../helpers/l10n").default;

const id = "EVENT_WEAPON_ATTACK";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player",
  },
  {
    key: "spriteSheetId",
    type: "sprite",
    label: l10n("FIELD_WEAPON_SPRITE"),
    defaultValue: "LAST_SPRITE",
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
