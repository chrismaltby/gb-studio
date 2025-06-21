const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_MOVE_RELATIVE";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_MOVEMENT",
};

const autoLabel = (fetchArg, input) => {
  const unitPostfix =
    input.units === "pixels" ? l10n("FIELD_PIXELS_SHORT") : "";
  return l10n("EVENT_ACTOR_MOVE_RELATIVE_LABEL", {
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
  },
  {
    type: "group",
    fields: [
      {
        key: "x",
        label: l10n("FIELD_X"),
        description: l10n("FIELD_X_RELATIVE_DESC"),
        type: "value",
        min: -31,
        max: 31,
        width: "50%",
        defaultValue: {
          type: "number",
          value: 0,
        },
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
      },
      {
        key: "y",
        label: l10n("FIELD_Y"),
        description: l10n("FIELD_Y_RELATIVE_DESC"),
        type: "value",
        min: -31,
        max: 31,
        width: "50%",
        defaultValue: {
          type: "number",
          value: 0,
        },
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
      },
    ],
  },
  {
    key: "moveType",
    label: l10n("FIELD_MOVE_TYPE"),
    description: l10n("FIELD_MOVE_TYPE_DESC"),
    hideLabel: true,
    type: "moveType",
    defaultValue: "horizontal",
    flexBasis: 30,
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
  },
];

const compile = (input, helpers) => {
  const { actorMoveRelativeByScriptValues } = helpers;
  actorMoveRelativeByScriptValues(
    input.actorId,
    input.x,
    input.y,
    input.useCollisions,
    input.moveType,
    input.units,
  );
};

module.exports = {
  id,
  description: l10n("EVENT_ACTOR_MOVE_RELATIVE_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
