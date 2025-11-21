const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SET_MOVEMENT_SPEED";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_PROPERTIES",
};

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_SET_MOVEMENT_SPEED_LABEL", {
    actor: fetchArg("actorId"),
    speed: fetchArg("speed"),
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
    key: "speed",
    label: l10n("FIELD_SPEED"),
    description: l10n("FIELD_SPEED_DESC"),
    type: "moveSpeed",
    defaultValue: 1,
  },
  {
    type: "group",
    wrapItems: true,
    conditions: [
      {
        sceneType: ["platform", "adventure"],
      },
      {
        or: [
          [
            {
              key: "actorId",
              eq: "$self$",
            },
            {
              entityTypeNot: ["actor"],
            },
          ],
          [
            {
              key: "actorId",
              eq: "player",
            },
          ],
        ],
      },
    ],
    fields: [
      {
        label: l10n("FIELD_SET_PLAYER_MOVEMENT_PLATFORMER_ADVENTURE_WARNING"),
        labelVariant: "warning",
        flexBasis: "100%",
      },
      {
        type: "addEventButton",
        hideLabel: true,
        label: l10n("EVENT_ENGINE_FIELD_SET"),
        defaultValue: {
          id: "EVENT_ENGINE_FIELD_SET",
          values: {
            engineFieldKey: "plat_walk_vel",
          },
          replace: true,
        },
        conditions: [
          {
            sceneType: ["platform"],
          },
        ],
      },
      {
        type: "addEventButton",
        hideLabel: true,
        label: l10n("EVENT_ENGINE_FIELD_SET"),
        defaultValue: {
          id: "EVENT_ENGINE_FIELD_SET",
          values: {
            engineFieldKey: "adv_walk_vel",
          },
          replace: true,
        },
        conditions: [
          {
            sceneType: ["adventure"],
          },
        ],
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetMovementSpeed } = helpers;
  actorSetActive(input.actorId);
  actorSetMovementSpeed(input.speed);
};

module.exports = {
  id,
  description: l10n("EVENT_ACTOR_SET_MOVEMENT_SPEED_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
};
