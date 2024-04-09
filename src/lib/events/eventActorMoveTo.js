const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_MOVE_TO";
const groups = ["EVENT_GROUP_ACTOR"];
const weight = 2;

const autoLabel = (fetchArg, input) => {
  const unitPostfix =
    input.units === "pixels" ? l10n("FIELD_PIXELS_SHORT") : "";
  return l10n("EVENT_ACTOR_MOVE_TO_LABEL", {
    actor: fetchArg("actorId"),
    x: `${fetchArg("x")}${unitPostfix}`,
    y: `${fetchArg("y")}${unitPostfix}`,
  });
};

const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: l10n("FIELD_ACTOR_MOVE_DESC"),
    type: "actor",
    defaultValue: "$self$",
    flexBasis: 0,
    minWidth: 150,
  },
  {
    type: "group",
    wrapItems: true,
    fields: [
      {
        key: "x",
        label: l10n("FIELD_X"),
        description: l10n("FIELD_X_DESC"),
        type: "value",
        min: 0,
        max: 255,
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
        defaultValue: {
          type: "number",
          value: 0,
        },
      },
      {
        key: "y",
        label: l10n("FIELD_Y"),
        description: l10n("FIELD_Y_DESC"),
        type: "value",
        min: 0,
        max: 255,
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
        defaultValue: {
          type: "number",
          value: 0,
        },
      },
    ],
  },
  {
    type: "group",
    flexBasis: 0,
    minWidth: 150,
    alignBottom: true,
    fields: [
      {
        key: "moveType",
        label: l10n("FIELD_MOVE_TYPE"),
        description: l10n("FIELD_MOVE_TYPE_DESC"),
        hideLabel: true,
        type: "moveType",
        defaultValue: "horizontal",
        flexBasis: 35,
        flexGrow: 0,
        alignBottom: true,
      },
      {
        key: "useCollisions",
        label: l10n("FIELD_USE_COLLISIONS"),
        description: l10n("FIELD_USE_COLLISIONS_DESC"),
        width: "50%",
        type: "checkbox",
        defaultValue: false,
        alignBottom: true,
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { actorMoveToScriptValues } = helpers;
  actorMoveToScriptValues(
    input.actorId,
    input.x,
    input.y,
    input.useCollisions,
    input.moveType,
    input.units
  );
};

module.exports = {
  id,
  description: l10n("EVENT_ACTOR_MOVE_TO_DESC"),
  autoLabel,
  groups,
  weight,
  fields,
  compile,
  waitUntilAfterInitFade: true,
  helper: {
    type: "position",
    x: "x",
    y: "y",
    units: "units",
    tileWidth: 2,
  },
};
