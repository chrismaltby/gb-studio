const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_MOVE_TO_VALUE";
const groups = ["EVENT_GROUP_ACTOR"];

const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    type: "actor",
    defaultValue: "$self$",
  },
  {
    type: "group",
    fields: [
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
    ],
  },
  {
    key: "axis",
    width: "50%",
    label: l10n("FIELD_LOCK_AXIS"),
    description: l10n("FIELD_LOCK_AXIS_DESC"),
    type: "togglebuttons",
    options: [
      ["x", "H", l10n("FIELD_HORIZONTAL")],
      ["y", "V", l10n("FIELD_VERTICAL")],
    ],
    allowMultiple: true,
    allowNone: true,
    defaultValue: [],
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorMoveToVariables } = helpers;
  actorSetActive(input.actorId);
  actorMoveToVariables(input.vectorX, input.vectorY, input.axis, "tiles");
};

module.exports = {
  id,
  deprecated: true,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
