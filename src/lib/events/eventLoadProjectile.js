const l10n = require("../helpers/l10n").default;

const id = "EVENT_LOAD_PROJECTILE_SLOT";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_ACTIONS",
};

const fields = [
  {
    key: "__section",
    type: "tabs",
    defaultValue: "projectile",
    variant: "eventSection",
    values: {
      projectile: l10n("FIELD_PROJECTILE"),
      presets: l10n("FIELD_PRESETS"),
    },
  },
  {
    key: "slot",
    label: l10n("FIELD_PROJECTILE_SLOT"),
    description: l10n("FIELD_LOAD_PROJECTILE_SLOT_DESC"),
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
        in: ["projectile", undefined],
      },
    ],
  },
  {
    type: "group",
    conditions: [
      {
        key: "__section",
        in: ["projectile", undefined],
      },
    ],
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
    type: "group",
    conditions: [
      {
        key: "__section",
        in: ["projectile", undefined],
      },
    ],
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
    type: "group",
    alignBottom: true,
    conditions: [
      {
        key: "__section",
        in: ["projectile", undefined],
      },
    ],
    fields: [
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
        key: "initialOffset",
        label: l10n("FIELD_INITIAL_OFFSET"),
        description: l10n("FIELD_PROJECTILE_OFFSET_DESC"),
        type: "number",
        min: 0,
        max: 256,
        width: "50%",
        defaultValue: 0,
      },
    ],
  },
  {
    type: "group",
    alignBottom: true,
    conditions: [
      {
        key: "__section",
        in: ["projectile", undefined],
      },
    ],
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
    conditions: [
      {
        key: "__section",
        in: ["projectile", undefined],
      },
    ],
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
    id: "projectile",
    label: l10n("FIELD_PROJECTILE"),
    fields: [
      "spriteSheetId",
      "spriteStateId",
      "speed",
      "animSpeed",
      "lifeTime",
      "loopAnim",
      "destroyOnHit",
      "initialOffset",
      "collisionGroup",
      "collisionMask",
    ],
    selected: true,
  },
];

const userPresetsIgnore = ["__section"];

const compile = (input, helpers) => {
  const { loadProjectile } = helpers;
  loadProjectile(
    input.slot,
    input.spriteSheetId,
    input.spriteStateId,
    input.speed,
    input.animSpeed,
    input.loopAnim,
    input.lifeTime,
    input.initialOffset,
    input.destroyOnHit,
    input.collisionGroup,
    input.collisionMask,
  );
};

module.exports = {
  id,
  description: l10n("EVENT_LOAD_PROJECTILE_SLOT_DESC"),
  groups,
  subGroups,
  fields,
  compile,
  userPresetsGroups,
  userPresetsIgnore,
};
