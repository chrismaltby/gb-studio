const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SET_POSITION";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_MOVEMENT",
};

const autoLabel = (fetchArg, input) => {
  const unitPostfix =
    input.units === "pixels" ? l10n("FIELD_PIXELS_SHORT") : "";
  return l10n("EVENT_ACTOR_SET_POSITION_LABEL", {
    actor: fetchArg("actorId"),
    x: `${fetchArg("x")}${unitPostfix}`,
    y: `${fetchArg("y")}${unitPostfix}`,
  });
};

const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: l10n("FIELD_ACTOR_UPDATE_DESC"),
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
];

const compile = (input, helpers) => {
  const { actorSetPositionToScriptValues } = helpers;
  actorSetPositionToScriptValues(input.actorId, input.x, input.y, input.units);
};

module.exports = {
  id,
  description: l10n("EVENT_ACTOR_SET_POSITION_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
  helper: {
    type: "position",
    x: "x",
    y: "y",
    units: "units",
    tileWidth: 2,
  },
};
