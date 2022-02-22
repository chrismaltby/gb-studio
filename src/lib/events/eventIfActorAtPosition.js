const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_ACTOR_AT_POSITION";
const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg, input) => {
  if (input.units === "pixels") {
    return l10n("EVENT_IF_ACTOR_AT_POSITION_LABEL", {
      actor: fetchArg("actorId"),
      units: l10n("FIELD_PIXELS"),
      x: fetchArg("x"),
      y: fetchArg("y"),
    });
  }
  return l10n("EVENT_IF_ACTOR_AT_POSITION_LABEL", {
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
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: 0,
      },
      {
        key: "y",
        label: l10n("FIELD_Y"),
        type: "number",
        min: 0,
        max: 255,
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
        min: 0,
        max: 2040,
        width: "50%",
        defaultValue: 0,
      },
      {
        key: "py",
        label: l10n("FIELD_Y"),
        type: "number",
        min: 0,
        max: 2040,
        width: "50%",
        defaultValue: 0,
      },
    ],
  },
  {
    key: "true",
    label: l10n("FIELD_TRUE"),
    type: "events",
  },
  {
    key: "__collapseElse",
    label: l10n("FIELD_ELSE"),
    type: "collapsable",
    defaultValue: true,
    conditions: [
      {
        key: "__disableElse",
        ne: true,
      },
    ],
  },
  {
    key: "false",
    label: l10n("FIELD_FALSE"),
    conditions: [
      {
        key: "__collapseElse",
        ne: true,
      },
      {
        key: "__disableElse",
        ne: true,
      },
    ],
    type: "events",
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, ifActorAtPosition } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  actorSetActive(input.actorId);
  ifActorAtPosition(input.units === "tiles" ? input.x : input.px, input.units === "tiles" ? input.y : input.py, truePath, falsePath, input.units);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};
