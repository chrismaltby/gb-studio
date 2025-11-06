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
        type: "value",
        min: -96,
        max: 96,
        width: "50%",
        defaultValue: {
          type: "number",
          value: 0,
        },
        unitsField: "units",
        unitsDefault: "pixels",
        unitsAllowed: ["pixels"],
      },
      {
        key: "y",
        label: l10n("FIELD_Y"),
        description: l10n("FIELD_Y_DESC"),
        type: "value",
        min: -96,
        max: 96,
        defaultValue: {
          type: "number",
          value: -8,
        },
        width: "50%",
        unitsField: "units",
        unitsDefault: "pixels",
        unitsAllowed: ["pixels"],
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
        type: "value",
        min: 0,
        max: 128,
        defaultValue: {
          type: "number",
          value: 16,
        },
        width: "50%",
        unitsField: "units",
        unitsDefault: "pixels",
        unitsAllowed: ["pixels"],
      },
      {
        key: "height",
        label: l10n("FIELD_HEIGHT"),
        description: l10n("FIELD_BOX_HEIGHT_DESC"),
        type: "value",
        min: 0,
        max: 128,
        defaultValue: {
          type: "number",
          value: 16,
        },
        width: "50%",
        unitsField: "units",
        unitsDefault: "pixels",
        unitsAllowed: ["pixels"],
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { actorSetBoundToScriptValues } = helpers;
  const { actorId, x, y, width, height } = input;
  actorSetBoundToScriptValues(actorId, x, y, width, height);
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
