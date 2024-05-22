const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_ACTOR_RELATIVE_TO_ACTOR";
const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_ACTOR"];
const subGroups = {
  "EVENT_GROUP_ACTOR": "EVENT_GROUP_CONTROL_FLOW",
  "EVENT_GROUP_CONTROL_FLOW": "EVENT_GROUP_ACTOR"
}

const autoLabel = (fetchArg) => {
  const dir = fetchArg("operation");
  let direction = l10n("FIELD_IS_ABOVE");
  if (dir === "down") {
    direction = l10n("FIELD_IS_BELOW");
  } else if (dir === "left") {
    direction = l10n("FIELD_IS_LEFT_OF");
  } else if (dir === "right") {
    direction = l10n("FIELD_IS_RIGHT_OF");
  }
  return l10n("EVENT_IF_ACTOR_RELATIVE_TO_ACTOR_LABEL", {
    actor: fetchArg("actorId"),
    direction,
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
  },
  {
    key: "operation",
    label: l10n("FIELD_COMPARISON"),
    description: l10n("FIELD_COMPARISON_RELATIVE_DESC"),
    type: "select",
    options: [
      ["up", l10n("FIELD_IS_ABOVE")],
      ["down", l10n("FIELD_IS_BELOW")],
      ["left", l10n("FIELD_IS_LEFT_OF")],
      ["right", l10n("FIELD_IS_RIGHT_OF")],
    ],
    defaultValue: "up",
    width: "50%",
  },
  {
    key: "otherActorId",
    label: l10n("FIELD_OTHER_ACTOR"),
    description: l10n("FIELD_ACTOR_RELATIVE_DESC"),
    type: "actor",
    defaultValue: "$self$",
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
  const { actorSetActive, ifActorRelativeToActor } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  actorSetActive(input.actorId);
  ifActorRelativeToActor(
    input.operation,
    input.otherActorId,
    truePath,
    falsePath
  );
};

module.exports = {
  id,
  description: l10n("EVENT_IF_ACTOR_RELATIVE_TO_ACTOR_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
};
