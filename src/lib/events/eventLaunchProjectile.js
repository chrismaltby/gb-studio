const l10n = require("../helpers/l10n").default;

const id = "EVENT_LAUNCH_PROJECTILE";
const groups = ["EVENT_GROUP_ACTOR"];

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
    type: "group",
    fields: [
      {
        key: "x",
        label: l10n("FIELD_OFFSET_X"),
        type: "number",
        min: -256,
        max: 256,
        width: "50%",
        defaultValue: 0,
      },
      {
        key: "y",
        label: l10n("FIELD_OFFSET_Y"),
        type: "number",
        min: -256,
        max: 256,
        width: "50%",
        defaultValue: 0,
      },
    ],
  },

  {
    type: "group",
    width: "50%",
    fields: [
      {
        key: "otherActorId",
        label: l10n("FIELD_DIRECTION"),
        type: "actor",
        defaultValue: "right",
        conditions: [
          {
            key: "directionType",
            eq: "actor",
          },
        ],
      },
      {
        key: "direction",
        label: l10n("FIELD_DIRECTION"),
        type: "direction",
        defaultValue: "$self$",
        conditions: [
          {
            key: "directionType",
            eq: "direction",
          },
        ],
      },
      {
        key: "directionVariable",
        label: l10n("FIELD_DIRECTION"),
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        conditions: [
          {
            key: "directionType",
            eq: "var",
          },
        ],
      },
      {
        key: "angle",
        label: l10n("FIELD_ANGLE"),
        type: "number",
        defaultValue: 0,
        conditions: [
          {
            key: "directionType",
            eq: "angle",
          },
        ],
      },
      {
        key: "angleVariable",
        label: l10n("FIELD_ANGLE"),
        type: "variable",
        defaultValue: "LAST_VARIABLE",
        conditions: [
          {
            key: "directionType",
            eq: "anglevar",
          },
        ],
      },
      {
        key: "directionType",
        type: "selectbutton",
        options: [
          ["direction", l10n("FIELD_FIXED_DIRECTION")],
          ["actor", l10n("FIELD_ACTOR_DIRECTION")],
          ["angle", l10n("FIELD_ANGLE")],
          ["anglevar", l10n("FIELD_ANGLE_VARIABLE")],
          ["var", l10n("FIELD_DIRECTION_VARIABLE")],
        ],
        inline: true,
        defaultValue: "direction",
      },
    ],
  },
  {
    key: "speed",
    label: l10n("FIELD_SPEED"),
    type: "moveSpeed",
    defaultValue: 2,
    width: "50%",
  },
  {
    key: "collisionGroup",
    label: l10n("FIELD_COLLISION_GROUP"),
    type: "collisionMask",
    width: "50%",
    includePlayer: false,
    defaultValue: "3",
  },
  {
    key: "collisionMask",
    label: l10n("FIELD_COLLIDE_WITH"),
    type: "collisionMask",
    width: "50%",
    includePlayer: true,
    defaultValue: ["1"],
  },
];

const compile = (input, helpers) => {
  const {
    launchProjectile,
    launchProjectileInDirection,
    launchProjectileInAngle,
    launchProjectileInSourceActorDirection,
    launchProjectileInActorDirection,
    launchProjectileInAngleVariable,
    actorSetActive,
    variableFromUnion,
    temporaryEntityVariable,
  } = helpers;

  console.log("LAUNCH", JSON.stringify(input));

  // const dirVar = variableFromUnion(input.direction, temporaryEntityVariable(0));
  actorSetActive(input.actorId);
  if (input.directionType === "direction") {
    launchProjectileInDirection(
      input.spriteSheetId,
      input.x,
      input.y,
      input.direction,
      input.speed,
      input.collisionGroup,
      input.collisionMask
    );
  } else if (input.directionType === "angle") {
    launchProjectileInAngle(
      input.spriteSheetId,
      input.x,
      input.y,
      input.angle,
      input.speed,
      input.collisionGroup,
      input.collisionMask
    );
  } else if (input.directionType === "anglevar") {
    launchProjectileInAngleVariable(
      input.spriteSheetId,
      input.x,
      input.y,
      input.angleVariable,
      input.speed,
      input.collisionGroup,
      input.collisionMask
    );
  } else if (input.directionType === "actor") {
    if (input.actorId === input.otherActorId) {
      launchProjectileInSourceActorDirection(
        input.spriteSheetId,
        input.x,
        input.y,
        input.speed,
        input.collisionGroup,
        input.collisionMask
      );
    } else {
      launchProjectileInActorDirection(
        input.spriteSheetId,
        input.x,
        input.y,
        input.otherActorId,
        input.speed,
        input.collisionGroup,
        input.collisionMask
      );
    }
  }
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
