const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_ACTOR_IN_RANGE";
const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg, input) => {
  if (input.units === "pixels") {
    return l10n("EVENT_IF_ACTOR_IN_RANGE_LABEL", {
      actor1: fetchArg("actorId1"),
      actor2: fetchArg("actorId2"),
      units: l10n("FIELD_PIXELS"),
      x1: fetchArg("px1"),
      y1: fetchArg("py1"),
      x2: fetchArg("px2"),
      y2: fetchArg("py2"),
    });
  }
  return l10n("EVENT_IF_ACTOR_IN_RANGE_LABEL", {
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
        type: "union",
        types: ["number", "variable", "property"],
        defaultType: "number",
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
          property: "$self$:xpos",
        },
      },
      {
        key: "y2",
        label: l10n("FIELD_LOWER_BOUNDARY"),
        type: "union",
        types: ["number", "variable", "property"],
        defaultType: "number",
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
          property: "$self$:xpos",
        },
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
        type: "union",
        types: ["number", "variable", "property"],
        defaultType: "number",
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
          property: "$self$:xpos",
        },
      },
      {
        key: "x2",
        label: l10n("FIELD_RIGHT_BOUNDARY"),
        type: "union",
        types: ["number", "variable", "property"],
        defaultType: "number",
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
          property: "$self$:xpos",
        },
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
        type: "union",
        types: ["number", "variable", "property"],
        defaultType: "number",
        min: 0,
        max: 2040,
        width: "50%",
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
          property: "$self$:xpos",
        },
      },
      {
        key: "py2",
        label: l10n("FIELD_LOWER_BOUNDARY"),
        type: "union",
        types: ["number", "variable", "property"],
        defaultType: "number",
        min: 0,
        max: 2040,
        width: "50%",
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
          property: "$self$:xpos",
        },
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
        type: "union",
        types: ["number", "variable", "property"],
        defaultType: "number",
        min: 0,
        max: 2040,
        width: "50%",
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
          property: "$self$:xpos",
        },
      },
      {
        key: "px2",
        label: l10n("FIELD_RIGHT_BOUNDARY"),
        type: "union",
        types: ["number", "variable", "property"],
        defaultType: "number",
        min: 0,
        max: 2040,
        width: "50%",
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
          property: "$self$:xpos",
        },
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
  const { actorSetActive, ifActorInRange, ifActorInRangeVariables, temporaryEntityVariable, variableFromUnion } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  actorSetActive(input.actorId1);
  if (input.units === "tiles") {
    if (input.x1.type === "number" && input.y1.type === "number" && input.x2.type === "number" && input.y2.type === "number") {
      ifActorInRange(input.actorId2, input.x1.value, input.y1.value, input.x2.value, input.y2.value, truePath, falsePath, input.units);
    } else {
      const x1Var = variableFromUnion(input.x1, temporaryEntityVariable(0));
      const y1Var = variableFromUnion(input.y1, temporaryEntityVariable(1));
      const x2Var = variableFromUnion(input.x2, temporaryEntityVariable(2));
      const y2Var = variableFromUnion(input.y2, temporaryEntityVariable(3));
      ifActorInRangeVariables(input.actorId2, x1Var, y1Var, x2Var, y2Var, truePath, falsePath, input.units);
    }
  } else {
    if (input.px1.type === "number" && input.py1.type === "number" && input.px2.type === "number" && input.py2.type === "number") {
      ifActorInRange(input.actorId2, input.px1.value, input.py1.value, input.px2.value, input.py2.value, truePath, falsePath, input.units);
    } else {
      const px1Var = variableFromUnion(input.px1, temporaryEntityVariable(0));
      const py1Var = variableFromUnion(input.py1, temporaryEntityVariable(1));
      const px2Var = variableFromUnion(input.px2, temporaryEntityVariable(2));
      const py2Var = variableFromUnion(input.py2, temporaryEntityVariable(3));
      ifActorInRangeVariables(input.actorId2, px1Var, py1Var, px2Var, py2Var, truePath, falsePath, input.units);
    }
  }
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};
