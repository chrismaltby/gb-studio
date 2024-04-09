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
        description: l10n("FIELD_SPRITE_SHEET_PROJECTILE_DESC"),
        defaultValue: "LAST_SPRITE",
      },
      {
        key: "spriteStateId",
        type: "animationstate",
        label: l10n("FIELD_ANIMATION_STATE"),
        description: l10n("FIELD_ANIMATION_STATE_DESC"),
        defaultValue: "",
      },
    ],
  },
  {
    key: "actorId",
    type: "actor",
    label: l10n("FIELD_SOURCE"),
    description: l10n("FIELD_ACTOR_PROJECTILE_SOURCE_DESC"),
    defaultValue: "$self$",
  },
  {
    type: "group",
    fields: [
      {
        key: "x",
        label: l10n("FIELD_OFFSET_X"),
        description: l10n("FIELD_PROJECTILE_OFFSET_X_DESC"),
        type: "number",
        min: -256,
        max: 256,
        width: "50%",
        defaultValue: 0,
      },
      {
        key: "y",
        label: l10n("FIELD_OFFSET_Y"),
        description: l10n("FIELD_PROJECTILE_OFFSET_Y_DESC"),
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
        description: l10n("FIELD_PROJECTILE_DIRECTION_DESC"),
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
        description: l10n("FIELD_PROJECTILE_DIRECTION_DESC"),
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
        description: l10n("FIELD_PROJECTILE_ANGLE_DESC"),
        type: "angle",
        defaultValue: 0,
        min: -256,
        max: 256,
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
        description: l10n("FIELD_PROJECTILE_ANGLE_DESC"),
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
        key: "targetActorId",
        label: l10n("FIELD_TARGET"),
        description: l10n("FIELD_PROJECTILE_TARGET_DESC"),
        type: "actor",
        defaultValue: "$self$",
        conditions: [
          {
            key: "directionType",
            eq: "target",
          },
        ],
      },
      {
        key: "directionType",
        type: "selectbutton",
        options: [
          ["direction", l10n("FIELD_FIXED_DIRECTION")],
          ["actor", l10n("FIELD_ACTOR_DIRECTION")],
          ["target", l10n("FIELD_ACTOR_TARGET")],
          ["angle", l10n("FIELD_ANGLE")],
          ["anglevar", l10n("FIELD_ANGLE_VARIABLE")],
        ],
        inline: true,
        defaultValue: "direction",
        alignBottom: true,
      },
    ],
  },
  {
    key: "initialOffset",
    label: l10n("FIELD_DIRECTION_OFFSET"),
    description: l10n("FIELD_PROJECTILE_OFFSET_DESC"),
    type: "number",
    min: 0,
    max: 256,
    width: "50%",
    defaultValue: 0,
  },
  {
    type: "group",
    fields: [
      {
        key: "speed",
        label: l10n("FIELD_SPEED"),
        description: l10n("FIELD_SPEED_DESC"),
        type: "moveSpeed",
        allowNone: true,
        defaultValue: 2,
        width: "50%",
      },
      {
        key: "animSpeed",
        label: l10n("FIELD_ANIMATION_SPEED"),
        description: l10n("FIELD_ANIMATION_SPEED_DESC"),
        type: "animSpeed",
        defaultValue: 15,
        width: "50%",
      },
    ],
  },
  {
    key: "lifeTime",
    label: l10n("FIELD_LIFE_TIME"),
    description: l10n("FIELD_PROJECTILE_LIFE_TIME_DESC"),
    type: "number",
    min: 0,
    max: 4,
    step: 0.1,
    width: "50%",
    defaultValue: 1,
  },
  {
    type: "group",
    alignBottom: true,
    fields: [
      {
        key: "loopAnim",
        label: l10n("FIELD_LOOP_ANIMATION"),
        description: l10n("FIELD_LOOP_ANIMATION_DESC"),
        type: "checkbox",
        defaultValue: true,
      },
      {
        key: "destroyOnHit",
        label: l10n("FIELD_DESTROY_ON_HIT"),
        description: l10n("FIELD_PROJECTILE_DESTROY_ON_HIT_DESC"),
        type: "checkbox",
        defaultValue: true,
      },
    ],
  },
  {
    type: "group",
    fields: [
      {
        key: "collisionGroup",
        label: l10n("FIELD_COLLISION_GROUP"),
        description: l10n("FIELD_COLLISION_GROUP_DESC"),
        type: "collisionMask",
        width: "50%",
        includePlayer: false,
        defaultValue: "3",
      },
      {
        key: "collisionMask",
        label: l10n("FIELD_COLLIDE_WITH"),
        description: l10n("FIELD_COLLIDE_WITH_DESC"),
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
    launchProjectileTowardsActor,
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
  if (projectileIndex < 0) {
    return;
  }
  if (input.directionType === "direction") {
    launchProjectileInDirection(
      projectileIndex,
      input.x,
      input.y,
      input.direction,
      input.destroyOnHit,
      input.loopAnim
    );
  } else if (input.directionType === "angle") {
    launchProjectileInAngle(
      projectileIndex,
      input.x,
      input.y,
      input.angle,
      input.destroyOnHit,
      input.loopAnim
    );
  } else if (input.directionType === "anglevar") {
    launchProjectileInAngleVariable(
      projectileIndex,
      input.x,
      input.y,
      input.angleVariable,
      input.destroyOnHit,
      input.loopAnim
    );
  } else if (input.directionType === "actor") {
    if (input.actorId === input.otherActorId) {
      launchProjectileInSourceActorDirection(
        projectileIndex,
        input.x,
        input.y,
        input.destroyOnHit,
        input.loopAnim
      );
    } else {
      launchProjectileInActorDirection(
        projectileIndex,
        input.x,
        input.y,
        input.otherActorId,
        input.destroyOnHit,
        input.loopAnim
      );
    }
  } else if (input.directionType === "target") {
    if (input.actorId === input.targetActorId) {
      launchProjectileInSourceActorDirection(
        projectileIndex,
        input.x,
        input.y,
        input.destroyOnHit,
        input.loopAnim
      );
    } else {
      launchProjectileTowardsActor(
        projectileIndex,
        input.x,
        input.y,
        input.targetActorId,
        input.destroyOnHit,
        input.loopAnim
      );
    }
  }
};

module.exports = {
  id,
  description: l10n("EVENT_LAUNCH_PROJECTILE_DESC"),
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
