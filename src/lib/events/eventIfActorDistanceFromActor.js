const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_ACTOR_DISTANCE_FROM_ACTOR";
const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg) => {
  const distance = fetchArg("distance");
  return l10n("EVENT_IF_ACTOR_DISTANCE_FROM_ACTOR_LABEL", {
    actor: fetchArg("actorId"),
    distance,
    otherActor: fetchArg("otherActorId"),
  });
};

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player",
  },
  {
    key: "distance",
    label: l10n("FIELD_DISTANCE_PU"),
    type: "number",
    min: 0,
    max: 181,
    width: "50%",
    defaultValue: 0,
  },
  {
    key: "otherActorId",
    type: "actor",
    defaultValue: "$self$",
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
  const { actorSetActive, ifActorDistanceFromActor } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  actorSetActive(input.actorId);
  ifActorDistanceFromActor(
    input.distance,
    input.otherActorId,
    truePath,
    falsePath
  );
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};
