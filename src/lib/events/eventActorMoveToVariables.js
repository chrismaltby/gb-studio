const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_MOVE_TO_VALUE";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "vectorX",
    type: "variable",
    label: l10n("FIELD_X"),
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "vectorY",
    type: "variable",
    label: l10n("FIELD_Y"),
    defaultValue: "LAST_VARIABLE",
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorMoveToVariables } = helpers;
  actorSetActive(input.actorId);
  actorMoveToVariables(input.vectorX, input.vectorY);
};

module.exports = {
  id,
  fields,
  compile,
};
