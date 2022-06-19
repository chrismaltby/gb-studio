const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_ACTOR_IN_RADIUS";
const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg, input) => {
  if (input.units === "pixels") {
    return l10n("EVENT_IF_ACTOR_IN_RADIUS_LABEL", {
      actor1: fetchArg("actorId1"),
      actor2: fetchArg("actorId2"),
      units: l10n("FIELD_PIXELS"),
      x1: fetchArg("px1"),
      y1: fetchArg("py1"),
      x2: fetchArg("px2"),
      y2: fetchArg("py2"),
    });
  }
  return l10n("EVENT_IF_ACTOR_IN_RADIUS_LABEL", {
    actor1: fetchArg("actorId1"),
    actor2: fetchArg("actorId2"),
    units: l10n("FIELD_TILES"),
    x1: fetchArg("x1"),
    y1: fetchArg("y1"),
    x2: fetchArg("x2"),
    y2: fetchArg("y2"),
  });
};

const fields = [
  {
    key: "actorId1",
    label: l10n("ACTOR"),
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "actorId2",
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
        key: "y1",
        label: l10n("FIELD_UPPER_BOUNDARY"),
        type: "number",
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: 0,
      },
      {
        key: "y2",
        label: l10n("FIELD_LOWER_BOUNDARY"),
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
        eq: "tiles",
      },
    ],
    fields: [
      {
        key: "x1",
        label: l10n("FIELD_LEFT_BOUNDARY"),
        type: "number",
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: 0,
      },
      {
        key: "x2",
        label: l10n("FIELD_RIGHT_BOUNDARY"),
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
        key: "py1",
        label: l10n("FIELD_UPPER_BOUNDARY"),
        type: "number",
        min: 0,
        max: 2040,
        width: "50%",
        defaultValue: 0,
      },
      {
        key: "py2",
        label: l10n("FIELD_LOWER_BOUNDARY"),
        type: "number",
        min: 0,
        max: 2040,
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
        key: "px1",
        label: l10n("FIELD_LEFT_BOUNDARY"),
        type: "number",
        min: 0,
        max: 2040,
        width: "50%",
        defaultValue: 0,
      },
      {
        key: "px2",
        label: l10n("FIELD_RIGHT_BOUNDARY"),
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
  const { actorSetActive, ifActorInRadius } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  actorSetActive(input.actorId1);
  ifActorInRadius(input.actorId2, input.units === "tiles" ? input.x1 : input.px1, input.units === "tiles" ? input.y1 : input.py1, input.units === "tiles" ? input.x2 : input.px2, input.units === "tiles" ? input.y2 : input.py2, truePath, falsePath, input.units);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};
