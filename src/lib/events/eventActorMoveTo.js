const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_MOVE_TO";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player",
  },
  {
    key: "x",
    label: l10n("FIELD_X"),
    type: "union",
    types: ["number", "variable", "actor", "property"],
    min: 0,
    max: 255,
    width: "50%",
    defaultValue: {
      number: 5,
      actor: "player",
      variable: "LAST_VARIABLE"
    },
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
];

const compile = (input, helpers) => {
  const { actorSetActive, actorMoveTo } = helpers;
  actorSetActive(input.actorId);
  actorMoveTo(input.x, input.y);
};

module.exports = {
  id,
  fields,
  compile
};
