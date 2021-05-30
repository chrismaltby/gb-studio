const l10n = require("../helpers/l10n").default;

const id = "EVENT_LAUNCH_PROJECTILE";

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
    key: "direction",
    label: l10n("FIELD_DIRECTION"),
    type: "union",
    types: ["direction", "variable", "property"],
    defaultType: "direction",    
    defaultValue: {
      direction: "right",
      variable: "LAST_VARIABLE",
      property: "$self$:direction"
    },
  },
  {
    key: "speed",
    label: l10n("FIELD_SPEED"),
    type: "moveSpeed",
    defaultValue: 2
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
  const { launchProjectile, actorSetActive, variableFromUnion, temporaryEntityVariable } = helpers;
  const dirVar = variableFromUnion(input.direction, temporaryEntityVariable(0));
  actorSetActive(input.actorId);
  launchProjectile(input.spriteSheetId, input.x, input.y, dirVar, input.speed, input.collisionGroup, input.collisionMask);
};

module.exports = {
  id,
  fields,
  compile
};
