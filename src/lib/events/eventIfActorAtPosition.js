const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_ACTOR_AT_POSITION";
const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_IF_ACTOR_AT_POSITION_LABEL", {
    actor: fetchArg("actorId"),
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
  ifActorAtPosition(input.x, input.y, truePath, falsePath);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};
