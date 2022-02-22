const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SET_POSITION_RELATIVE";
const groups = ["EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg) => {
  if (input.units === "pixels") {
    return l10n("EVENT_ACTOR_SET_POSITION_RELATIVE_LABEL", {
      actor: fetchArg("actorId"),
      units: l10n("FIELD_PIXELS"),
      x: fetchArg("px"),
      y: fetchArg("py"),
    });
  }
  return l10n("EVENT_ACTOR_SET_POSITION_RELATIVE_LABEL", {
    actor: fetchArg("actorId"),
    units: l10n("FIELD_TILES"),
    x: fetchArg("x"),
    y: fetchArg("y"),
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
    key: "units",
    type: "select",
    options: [
      ["tiles", l10n("FIELD_TILES")],
      ["pixels", l10n("FIELD_PIXELS")],
    ],
    defaultValue: "tiles",
  },
  {
    type: "group",
    conditions: [
      {
        key: "units",
        eq: "tiles",
      },
    ],
    fields: [
      {
        key: "x",
        label: l10n("FIELD_X"),
        type: "number",
        min: -31,
        max: 31,
        width: "50%",
        defaultValue: 0,
      },
      {
        key: "y",
        label: l10n("FIELD_Y"),
        type: "number",
        min: -31,
        max: 31,
        width: "50%",
        defaultValue: 0,
      },
    ],
  },
  {
    type: "group",
    conditions: [
      {
        key: "units",
        eq: "pixels",
      },
    ],
    fields: [
      {
        key: "px",
        label: l10n("FIELD_X"),
        type: "number",
        min: -248,
        max: 248,
        width: "50%",
        defaultValue: 0,
      },
      {
        key: "py",
        label: l10n("FIELD_Y"),
        type: "number",
        min: -248,
        max: 248,
        width: "50%",
        defaultValue: 0,
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetPositionRelative } = helpers;
  actorSetActive(input.actorId);
  actorSetPositionRelative(input.units === "tiles" ? input.x : input.px, input.units === "tiles" ? input.y : input.py, input.units);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};
