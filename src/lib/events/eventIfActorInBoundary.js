const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_ACTOR_IN_BOUNDARY";

const fields = [
  {
    label: l10n("FIELD_IF_ACTOR_IN_BOUNDARY")
  },
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player"
  },
  {
    key: "x1",
    label: "X1",
    type: "union",
    types: ["number", "variable", "property"],
    defaultType: "number",
    min: 0,
    max: 255,
    width: "50%",
    defaultValue: {
      number: 0,
      variable: "LAST_VARIABLE",
      property: "$self$:xpos"
    },
  },
  {
    key: "y1",
    label: "Y1",
    type: "union",
    types: ["number", "variable", "property"],
    defaultType: "number",
    min: 0,
    max: 255,
    width: "50%",
    defaultValue: {
      number: 0,
      variable: "LAST_VARIABLE",
      property: "$self$:xpos"
    },   
  },
  {
    key: "x2",
    label: "X2",
    type: "union",
    types: ["number", "variable", "property"],
    defaultType: "number",
    min: 0,
    max: 255,
    width: "50%",
    defaultValue: {
      number: 0,
      variable: "LAST_VARIABLE",
      property: "$self$:xpos"
    },
  },
  {
    key: "y2",
    label: "Y2",
    type: "union",
    types: ["number", "variable", "property"],
    defaultType: "number",
    min: 0,
    max: 255,
    width: "50%",
    defaultValue: {
      number: 0,
      variable: "LAST_VARIABLE",
      property: "$self$:xpos"
    },   
  },
  {
    key: "true",
    type: "events"
  },
  {
    key: "__collapseElse",
    label: l10n("FIELD_ELSE"),
    type: "collapsable",
    defaultValue: false,
    conditions: [
      {
        key: "__disableElse",
        ne: true
      }
    ]
  },
  {
    key: "false",
    conditions: [
      {
        key: "__collapseElse",
        ne: true
      },
      {
        key: "__disableElse",
        ne: true
      }
    ],
    type: "events"
  }
];

const compile = (input, helpers) => {
  const { actorSetActive, ifActorInBoundary } = helpers;
  const x1 = input.x1.value;
  const y1 = input.y1.value;
  const x2 = input.x2.value;
  const y2 = input.y2.value;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  actorSetActive(input.actorId);
  ifActorInBoundary(x1, y1, x2, y2, truePath, falsePath);
};

module.exports = {
  id,
  fields,
  compile
};
