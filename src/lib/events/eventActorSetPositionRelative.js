const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SET_POSITION_RELATIVE";

const fields = [
  {
    key: "actorId",
    type: "actor",
    defaultValue: "$self$",
  },
  {
    key: "x",
    label: l10n("FIELD_X"),
    type: "number",
    min: -31,
    max: 31,
    width: "50%",
    defaultValue: 0,
  },
  {
    key: "y",
    label: l10n("FIELD_Y"),
    type: "number",
    min: -31,
    max: 31,
    width: "50%",
    defaultValue: 0,
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetPositionRelative } = helpers;
  actorSetActive(input.actorId);
  actorSetPositionRelative(input.x, input.y);
};

module.exports = {
  id,
  fields,
  compile,
  allowedBeforeInitFade: true,
};
