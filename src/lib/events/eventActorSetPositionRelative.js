const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SET_POSITION_RELATIVE";
const groups = ["EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg, input) => {
  const unitPostfix =
    input.units === "pixels" ? l10n("FIELD_PIXELS_SHORT") : "";
  return l10n("EVENT_ACTOR_SET_POSITION_RELATIVE_LABEL", {
    actor: fetchArg("actorId"),
    x: `${fetchArg("x")}${unitPostfix}`,
    y: `${fetchArg("y")}${unitPostfix}`,
  });
};

const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    type: "actor",
    defaultValue: "$self$",
  },
  {
    type: "group",
    fields: [
      {
        key: "x",
        label: l10n("FIELD_X"),
        type: "number",
        min: -31,
        max: 31,
        width: "50%",
        defaultValue: 0,
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
      },
      {
        key: "y",
        label: l10n("FIELD_Y"),
        type: "number",
        min: -31,
        max: 31,
        width: "50%",
        defaultValue: 0,
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetPositionRelative } = helpers;
  actorSetActive(input.actorId);
  actorSetPositionRelative(input.x, input.y, input.units);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};
