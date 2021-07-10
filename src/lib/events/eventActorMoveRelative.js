const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_MOVE_RELATIVE";
const groups = ["EVENT_GROUP_ACTOR"];

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
  {
    key: "moveType",
    label: l10n("FIELD_MOVEMENT_TYPE"),
    type: "select",
    options: [
      ["horizontal", "↔ " + l10n("FIELD_HORIZONTAL_FIRST")],
      ["vertical", "↕ " + l10n("FIELD_VERTICAL_FIRST")],
      ["diagonal", "⤡ " + l10n("FIELD_DIAGONAL")],
    ],
    defaultValue: "horizontal",
    width: "50%",
  },
  {
    key: "useCollisions",
    label: l10n("FIELD_USE_COLLISIONS"),
    width: "50%",
    alignCheckbox: true,
    type: "checkbox",
    defaultValue: false,
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorMoveRelative } = helpers;
  actorSetActive(input.actorId);
  actorMoveRelative(input.x, input.y, input.useCollisions, input.moveType);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
