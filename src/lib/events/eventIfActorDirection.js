const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_ACTOR_DIRECTION";
const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_IF_ACTOR_DIRECTION_LABEL", {
    actor: fetchArg("actorId"),
    direction: fetchArg("direction"),
  });
};

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "direction",
    type: "direction",
    defaultValue: "up",
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
  const { actorSetActive, ifActorDirection } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  actorSetActive(input.actorId);
  ifActorDirection(input.direction, truePath, falsePath);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};
