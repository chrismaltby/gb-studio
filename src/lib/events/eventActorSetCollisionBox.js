const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_SET_COLLISION_BOX";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_PROPERTIES",
};

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ACTOR_SET_COLLISION_BOX_LABEL", {
    actor: fetchArg("actorId"),
    x: fetchArg("x"),
    y: fetchArg("y"),
    width: fetchArg("width"),
    height: fetchArg("height"),
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
    type: "group",
    wrapItems: true,
    fields: [
      {
        key: "x",
        label: l10n("FIELD_X"),
        description: l10n("FIELD_X_DESC"),
        type: "number",
        min: -96,
        max: 96,
        defaultValue: 0,
        width: "50%",
      },
      {
        key: "y",
        label: l10n("FIELD_Y"),
        description: l10n("FIELD_Y_DESC"),
        type: "number",
        min: -96,
        max: 96,
        defaultValue: 0,
        width: "50%",
      },
    ],
  },
  {
    type: "group",
    wrapItems: true,
    fields: [
      {
        key: "width",
        label: l10n("FIELD_WIDTH"),
        description: l10n("FIELD_BOX_WIDTH_DESC"),
        type: "number",
        min: 0,
        max: 128,
        defaultValue: 16,
        width: "50%",
      },
      {
        key: "height",
        label: l10n("FIELD_HEIGHT"),
        description: l10n("FIELD_BOX_HEIGHT_DESC"),
        type: "number",
        min: 0,
        max: 128,
        defaultValue: 16,
        width: "50%",
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorSetBounds } = helpers;
  const { actorId, x, y, width, height } = input;
  actorSetActive(actorId);
  actorSetBounds(x, x + width - 1, y, y + height - 1);
};

module.exports = {
  id,
  description: l10n("EVENT_ACTOR_SET_COLLISION_BOX_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
  helper: {
    type: "bounds",
    actorId: "actorId",
    x: "x",
    y: "y",
    width: "width",
    height: "height",
  },
};
