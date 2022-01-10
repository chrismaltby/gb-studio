const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_GET_POSITION";
const groups = ["EVENT_GROUP_ACTOR", "EVENT_GROUP_VARIABLES"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_GET_POSITION_LABEL", {
    actor: fetchArg("actorId"),
    x: fetchArg("vectorX"),
    y: fetchArg("vectorY"),
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
    key: "vectorX",
    type: "variable",
    label: l10n("FIELD_X"),
    defaultValue: "LAST_VARIABLE",
    width: "50%",
  },
  {
    key: "vectorY",
    type: "variable",
    label: l10n("FIELD_Y"),
    defaultValue: "LAST_VARIABLE",
    width: "50%",
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorGetPosition } = helpers;
  actorSetActive(input.actorId);
  actorGetPosition(input.vectorX, input.vectorY);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};
