const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SET_DIRECTION";
const groups = ["EVENT_GROUP_ACTOR"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_SET_DIRECTION_LABEL", {
    actor: fetchArg("actorId"),
    direction: fetchArg("direction"),
  });
};

const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: l10n("FIELD_ACTOR_UPDATE_DESC"),
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "direction",
    label: l10n("FIELD_DIRECTION"),
    description: l10n("FIELD_DIRECTION_DESC"),
    type: "union",
    types: ["direction", "variable", "property"],
    defaultType: "direction",
    defaultValue: {
      direction: "up",
      variable: "LAST_VARIABLE",
      property: "$self$:direction",
    },
  },
];

const compile = (input, helpers) => {
  const {
    actorSetActive,
    actorSetDirection,
    actorSetDirectionToVariable,
    variableFromUnion,
    temporaryEntityVariable,
  } = helpers;

  if (input.direction.type === "direction") {
    actorSetActive(input.actorId);
    actorSetDirection(input.direction.value);
  } else if (typeof input.direction === "string") {
    actorSetActive(input.actorId);
    actorSetDirection(input.direction);
  } else {
    const dirVar = variableFromUnion(
      input.direction,
      temporaryEntityVariable(0)
    );
    actorSetActive(input.actorId);
    actorSetDirectionToVariable(dirVar);
  }
};

module.exports = {
  id,
  description: l10n("EVENT_ACTOR_SET_DIRECTION_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
};
