const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_MOVE_RELATIVE";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "player"
  },
  {
    key: "x",
    label: l10n("FIELD_X"),
    type: "number",
    min: -31,
    max: 31,
    width: "50%",
    defaultValue: 0
  },
  {
    key: "y",
    label: l10n("FIELD_Y"),
    type: "number",
    min: -31,
    max: 31,
    width: "50%",
    defaultValue: 0
  }
];

const compile = (input, helpers) => {
  const { actorSetActive, actorMoveRelative } = helpers;
  actorSetActive(input.actorId);
  actorMoveRelative(input.x, input.y);
};

module.exports = {
  id,
  fields,
  compile
};
