const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_ACTOR_DIRECTION";
const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_CONTROL_FLOW",
  EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_ACTOR",
};

const autoLabel = (fetchArg) => {
  return l10n("EVENT_IF_ACTOR_DIRECTION_LABEL", {
    actor: fetchArg("actorId"),
    direction: fetchArg("direction"),
  });
};

const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: l10n("FIELD_ACTOR_CHECK_DESC"),
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "direction",
    label: l10n("FIELD_DIRECTION"),
    description: l10n("FIELD_DIRECTION_DESC"),
    type: "value",
    defaultValue: {
      type: "direction",
      value: "up",
    },
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
  const { ifActorDirectionScriptValue } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  ifActorDirectionScriptValue(
    input.actorId,
    input.direction,
    truePath,
    falsePath
  );
};

module.exports = {
  id,
  description: l10n("EVENT_IF_ACTOR_DIRECTION_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
};
