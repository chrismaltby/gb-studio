const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_ACTOR_DISTANCE_FROM_ACTOR";
const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg) => {
  const distance = fetchArg("distance");
  return l10n("EVENT_IF_ACTOR_DISTANCE_FROM_ACTOR_LABEL", {
    actor: fetchArg("actorId"),
    operator: fetchArg("operator"),
    distance,
    otherActor: fetchArg("otherActorId"),
  });
};

const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: l10n("FIELD_ACTOR_CHECK_DESC"),
    type: "actor",
    defaultValue: "player",
    width: "50%",
  },
  {
    type: "group",
    fields: [
      {
        key: "operator",
        label: l10n("FIELD_COMPARISON"),
        description: l10n("FIELD_COMPARISON_DESC"),
        type: "operator",
        width: "50%",
        defaultValue: "<=",
      },
      {
        key: "distance",
        label: l10n("FIELD_DISTANCE"),
        description: l10n("FIELD_DISTANCE_DESC"),
        type: "union",
        types: ["number", "variable"],
        defaultType: "number",
        min: 0,
        max: 181,
        width: "50%",
        unitsDefault: "tiles",
        defaultValue: {
          number: 0,
          variable: "LAST_VARIABLE",
        },
      },
    ],
  },
  {
    key: "otherActorId",
    label: l10n("FIELD_FROM"),
    description: l10n("FIELD_ACTOR_DISTANCE_DESC"),
    type: "actor",
    defaultValue: "$self$",
    width: "50%",
  },
  {
    key: "true",
    label: l10n("FIELD_TRUE"),
    description: l10n("FIELD_TRUE_DESC"),
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
    description: l10n("FIELD_FALSE_DESC"),
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
  const {
    actorSetActive,
    ifActorDistanceFromActor,
    ifActorDistanceVariableFromActor,
    variableFromUnion,
    temporaryEntityVariable,
  } = helpers;

  const operationLookup = {
    "==": ".EQ",
    "!=": ".NE",
    "<": ".LT",
    ">": ".GT",
    "<=": ".LTE",
    ">=": ".GTE",
  };
  const operator = operationLookup[input.operator];

  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;

  if (input.distance.type === "number") {
    actorSetActive(input.actorId);
    ifActorDistanceFromActor(
      input.distance.value,
      operator,
      input.otherActorId,
      truePath,
      falsePath
    );
  } else {
    const distanceVar = variableFromUnion(
      input.distance,
      temporaryEntityVariable(0)
    );
    actorSetActive(input.actorId);
    ifActorDistanceVariableFromActor(
      distanceVar,
      operator,
      input.otherActorId,
      truePath,
      falsePath
    );
  }
};

module.exports = {
  id,
  description: l10n("EVENT_IF_ACTOR_DISTANCE_FROM_ACTOR_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
  helper: {
    type: "distance",
    actorId: "otherActorId",
    distance: "distance",
    operator: "operator",
  },
};
