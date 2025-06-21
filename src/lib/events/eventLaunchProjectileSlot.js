const l10n = require("../helpers/l10n").default;

const id = "EVENT_LAUNCH_PROJECTILE_SLOT";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_ACTIONS",
};

const fields = [
  {
    key: "__section",
    type: "tabs",
    defaultValue: "source",
    variant: "eventSection",
    values: {
      source: l10n("FIELD_SOURCE"),
      presets: l10n("FIELD_PRESETS"),
    },
  },
  {
    key: "actorId",
    type: "actor",
    label: l10n("FIELD_SOURCE"),
    description: l10n("FIELD_ACTOR_PROJECTILE_SOURCE_DESC"),
    defaultValue: "$self$",
    conditions: [
      {
        key: "__section",
        in: ["source", undefined],
      },
    ],
  },
  {
    type: "group",
    conditions: [
      {
        key: "__section",
        in: ["source", undefined],
      },
    ],
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
    conditions: [
      {
        key: "__section",
        in: ["source", undefined],
      },
    ],
    fields: [
      {
        label: l10n("FIELD_LAUNCH_AT"),
        key: "directionType",
        type: "select",
        options: [
          ["direction", l10n("FIELD_FIXED_DIRECTION")],
          ["actor", l10n("FIELD_ACTOR_DIRECTION")],
          ["target", l10n("FIELD_ACTOR_TARGET")],
          ["angle", l10n("FIELD_ANGLE")],
          ["anglevar", l10n("FIELD_ANGLE_VARIABLE")],
        ],
        defaultValue: "direction",
        alignBottom: true,
      },
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
    ],
  },
  {
    key: "slot",
    label: l10n("FIELD_PROJECTILE_SLOT"),
    description: l10n("FIELD_PROJECTILE_SLOT_DESC"),
    type: "togglebuttons",
    options: [0, 1, 2, 3, 4].map((n) => [
      n,
      l10n("FIELD_SLOT_N", { slot: n + 1 }),
      l10n("FIELD_PROJECTILE_SLOT_N", { slot: n + 1 }),
    ]),
    allowNone: false,
    defaultValue: 0,
    conditions: [
      {
        key: "__section",
        in: ["source", undefined],
      },
    ],
  },
  {
    type: "presets",
    conditions: [
      {
        key: "__section",
        in: ["presets"],
      },
    ],
  },
];

const userPresetsGroups = [
  {
    id: "slot",
    label: l10n("FIELD_PROJECTILE_SLOT"),
    fields: ["slot"],
    selected: true,
  },
  {
    id: "source",
    label: l10n("FIELD_SOURCE"),
    fields: ["actorId", "x", "y"],
    selected: true,
  },
  {
    id: "direction",
    label: l10n("FIELD_DIRECTION"),
    fields: [
      "directionType",
      "otherActorId",
      "direction",
      "angle",
      "angleVariable",
      "targetActorId",
      "initialOffset",
    ],
    selected: true,
  },
];

const userPresetsIgnore = ["__section"];

const compile = (input, helpers) => {
  const {
    launchProjectileInDirection,
    launchProjectileInAngle,
    launchProjectileInSourceActorDirection,
    launchProjectileInActorDirection,
    launchProjectileInAngleVariable,
    launchProjectileTowardsActor,
    actorSetActive,
  } = helpers;

  actorSetActive(input.actorId);
  const projectileIndex = input.slot;
  if (projectileIndex < 0) {
    return;
  }
  if (input.directionType === "direction") {
    launchProjectileInDirection(
      projectileIndex,
      input.x,
      input.y,
      input.direction,
    );
  } else if (input.directionType === "angle") {
    launchProjectileInAngle(projectileIndex, input.x, input.y, input.angle);
  } else if (input.directionType === "anglevar") {
    launchProjectileInAngleVariable(
      projectileIndex,
      input.x,
      input.y,
      input.angleVariable,
    );
  } else if (input.directionType === "actor") {
    if (input.actorId === input.otherActorId) {
      launchProjectileInSourceActorDirection(projectileIndex, input.x, input.y);
    } else {
      launchProjectileInActorDirection(
        projectileIndex,
        input.x,
        input.y,
        input.otherActorId,
      );
    }
  } else if (input.directionType === "target") {
    if (input.actorId === input.targetActorId) {
      launchProjectileInSourceActorDirection(projectileIndex, input.x, input.y);
    } else {
      launchProjectileTowardsActor(
        projectileIndex,
        input.x,
        input.y,
        input.targetActorId,
      );
    }
  }
};

module.exports = {
  id,
  description: l10n("EVENT_LAUNCH_PROJECTILE_SLOT_DESC"),
  groups,
  subGroups,
  fields,
  compile,
  userPresetsGroups,
  userPresetsIgnore,
  waitUntilAfterInitFade: true,
};
