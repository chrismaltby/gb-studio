const l10n = require("../helpers/l10n").default;

const id = "EVENT_LAUNCH_PROJECTILE";
const groups = ["EVENT_GROUP_ACTOR"];

const fields = [
  {
    type: "group",
    fields: [
      {
        key: "spriteSheetId",
        type: "sprite",
        label: l10n("FIELD_SPRITE_SHEET"),
        defaultValue: "LAST_SPRITE",
      },
      {
        key: "spriteStateId",
        type: "animationstate",
        label: l10n("FIELD_ANIMATION_STATE"),
        defaultValue: "",
      },
    ],
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
        defaultValue: "$self$",
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
        defaultValue: "right",
        conditions: [
          {
            key: "directionType",
            eq: "direction",
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
        ],
        inline: true,
        defaultValue: "direction",
      },
    ],
  },
  {
    key: "initialOffset",
    label: l10n("FIELD_DIRECTION_OFFSET"),
    type: "number",
    min: 0,
    max: 256,
    width: "50%",
    defaultValue: 0,
  },
  {
    key: "speed",
    label: l10n("FIELD_SPEED"),
    type: "moveSpeed",
    allowNone: true,
    defaultValue: 2,
    width: "50%",
  },
  {
    key: "animSpeed",
    label: l10n("FIELD_ANIMATION_SPEED"),
    type: "animSpeed",
    defaultValue: 15,
    width: "50%",
  },
  {
    key: "lifeTime",
    label: l10n("FIELD_LIFE_TIME"),
    type: "number",
    min: 0,
    max: 4,
    step: 0.1,
    width: "50%",
    defaultValue: 1,
  },
  {
    type: "group",
    fields: [
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
    ],
  },
];

const compile = (input, helpers) => {
  const {
    getProjectileIndex,
    launchProjectileInDirection,
    launchProjectileInAngle,
    launchProjectileInSourceActorDirection,
    launchProjectileInActorDirection,
    launchProjectileInAngleVariable,
    actorSetActive,
  } = helpers;

  actorSetActive(input.actorId);
  const projectileIndex = getProjectileIndex(
    input.spriteSheetId,
    input.spriteStateId,
    input.speed,
    input.animSpeed,
    input.lifeTime,
    input.initialOffset,
    input.collisionGroup,
    input.collisionMask
  );
  if (input.directionType === "direction") {
    launchProjectileInDirection(
      projectileIndex,
      input.x,
      input.y,
      input.direction
    );
  } else if (input.directionType === "angle") {
    launchProjectileInAngle(projectileIndex, input.x, input.y, input.angle);
  } else if (input.directionType === "anglevar") {
    launchProjectileInAngleVariable(
      projectileIndex,
      input.x,
      input.y,
      input.angleVariable
    );
  } else if (input.directionType === "actor") {
    if (input.actorId === input.otherActorId) {
      launchProjectileInSourceActorDirection(projectileIndex, input.x, input.y);
    } else {
      launchProjectileInActorDirection(
        projectileIndex,
        input.x,
        input.y,
        input.otherActorId
      );
    }
  }
};

module.exports = {
  id,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
