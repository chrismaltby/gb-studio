const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_EFFECTS";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_PROPERTIES",
};

const fields = [
  {
    key: "effect",
    label: l10n("FIELD_EFFECT"),
    description: l10n("FIELD_ACTOR_EFFECT_DESC"),
    type: "select",
    options: [
      ["flicker", l10n("FIELD_FLICKER")],
      ["splitIn", l10n("FIELD_SPLIT_IN")],
      ["splitOut", l10n("FIELD_SPLIT_OUT")],
    ],
    defaultValue: "flicker",
    width: "100%",
  },
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: l10n("FIELD_ACTOR_EFFECT_ACTOR_DESC"),
    type: "actor",
    defaultValue: "$self$",
    width: "100%",
  },
  {
    type: "group",
    wrapItems: true,
    conditions: [
      {
        key: "effect",
        in: ["splitIn", "splitOut"],
      },
    ],
    fields: [
      {
        key: "distance",
        label: l10n("FIELD_DISTANCE"),
        description: l10n("FIELD_DISTANCE_DESC"),
        type: "number",
        min: 1,
        max: 80,
        defaultValue: 20,
        unitsField: "units",
        unitsDefault: "pixels",
        unitsAllowed: ["tiles", "pixels"],
        conditions: [
          {
            key: "effect",
            in: ["splitIn", "splitOut"],
          },
        ],
        width: "50%",
      },
      {
        key: "speed",
        label: l10n("FIELD_SPEED"),
        description: l10n("FIELD_SPEED_DESC"),
        type: "moveSpeed",
        allowNone: false,
        defaultValue: 2,
        conditions: [
          {
            key: "effect",
            in: ["splitIn", "splitOut"],
          },
        ],
        width: "50%",
      },
    ],
  },
  {
    key: "time",
    type: "number",
    label: l10n("FIELD_DURATION"),
    description: l10n("FIELD_DURATION_ACTOR_EFFECT_DESC"),
    min: 0,
    max: 60,
    step: 0.1,
    defaultValue: 0.5,
    unitsField: "timeUnits",
    unitsDefault: "time",
    unitsAllowed: ["time", "frames"],
    conditions: [
      {
        key: "effect",
        in: ["flicker"],
      },
      {
        key: "timeUnits",
        ne: "frames",
      },
    ],
  },
  {
    key: "frames",
    label: l10n("FIELD_DURATION"),
    description: l10n("FIELD_DURATION_ACTOR_EFFECT_DESC"),
    type: "number",
    min: 0,
    max: 3600,
    width: "50%",
    defaultValue: 30,
    unitsField: "timeUnits",
    unitsDefault: "time",
    unitsAllowed: ["time", "frames"],
    conditions: [
      {
        key: "effect",
        in: ["flicker"],
      },
      {
        key: "timeUnits",
        eq: "frames",
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { actorFXSplitIn, actorFXSplitOut, actorFXFlicker } = helpers;
  if (input.effect === "splitIn") {
    actorFXSplitIn(input.actorId, input.distance, input.speed, input.units);
    return;
  }
  if (input.effect === "splitOut") {
    actorFXSplitOut(input.actorId, input.distance, input.speed, input.units);
    return;
  }
  if (input.effect === "flicker") {
    let frames = 0;
    if (input.timeUnits === "frames") {
      frames = typeof input.frames === "number" ? input.frames : 30;
    } else {
      const seconds = typeof input.time === "number" ? input.time : 0.5;
      frames = Math.ceil(seconds * 60);
    }
    actorFXFlicker(input.actorId, frames);
  }
};

module.exports = {
  id,
  description: l10n("EVENT_ACTOR_EFFECTS_DESC"),
  groups,
  subGroups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
