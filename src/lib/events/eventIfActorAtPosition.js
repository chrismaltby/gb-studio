const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_ACTOR_AT_POSITION";
const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_CONTROL_FLOW",
  EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_ACTOR",
};

const autoLabel = (fetchArg, input) => {
  const unitPostfix =
    input.units === "pixels" ? l10n("FIELD_PIXELS_SHORT") : "";
  return l10n("EVENT_IF_ACTOR_AT_POSITION_LABEL", {
    actor: fetchArg("actorId"),
    x: `${fetchArg("x")}${unitPostfix}`,
    y: `${fetchArg("y")}${unitPostfix}`,
  });
};

const fields = [
  {
    key: "actorId",
    label: l10n("ACTOR"),
    description: l10n("FIELD_ACTOR_CHECK_DESC"),
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
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: {
          type: "number",
          value: 0,
        },
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
      },
      {
        key: "y",
        label: l10n("FIELD_Y"),
        description: l10n("FIELD_Y_DESC"),
        type: "value",
        min: 0,
        max: 255,
        width: "50%",
        defaultValue: {
          type: "number",
          value: 0,
        },
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
      },
    ],
  },
  {
    key: "true",
    label: l10n("FIELD_TRUE"),
    description: l10n("FIELD_TRUE_DESC"),
    type: "events",
  },
  {
    key: "__collapseElse",
    label: l10n("FIELD_ELSE"),
    type: "collapsable",
    defaultValue: true,
    conditions: [
      {
        key: "__disableElse",
        ne: true,
      },
    ],
  },
  {
    key: "false",
    label: l10n("FIELD_FALSE"),
    description: l10n("FIELD_FALSE_DESC"),
    conditions: [
      {
        key: "__collapseElse",
        ne: true,
      },
      {
        key: "__disableElse",
        ne: true,
      },
    ],
    type: "events",
  },
];

const compile = (input, helpers) => {
  const { ifActorAtPositionByScriptValues } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  ifActorAtPositionByScriptValues(
    input.actorId,
    input.x,
    input.y,
    truePath,
    falsePath,
    input.units
  );
};

module.exports = {
  id,
  description: l10n("EVENT_IF_ACTOR_AT_POSITION_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
  helper: {
    type: "position",
    x: "x",
    y: "y",
    units: "units",
    tileWidth: 2,
  },
};
