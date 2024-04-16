const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_GET_POSITION";
const groups = ["EVENT_GROUP_ACTOR", "EVENT_GROUP_VARIABLES"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_VARIABLES",
  EVENT_GROUP_VARIABLES: "EVENT_GROUP_ACTOR",
};

const autoLabel = (fetchArg, _input) => {
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
    description: l10n("FIELD_ACTOR_CHECK_DESC"),
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
        description: l10n("FIELD_X_VARIABLE_DESC"),
        defaultValue: "LAST_VARIABLE",
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
      },
      {
        key: "vectorY",
        type: "variable",
        label: l10n("FIELD_Y"),
        description: l10n("FIELD_Y_VARIABLE_DESC"),
        defaultValue: "LAST_VARIABLE",
        width: "50%",
        unitsField: "units",
        unitsDefault: "tiles",
        unitsAllowed: ["tiles", "pixels"],
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { actorSetActive, actorGetPosition } = helpers;
  actorSetActive(input.actorId);
  actorGetPosition(input.vectorX, input.vectorY, input.units);
};

module.exports = {
  id,
  description: l10n("EVENT_ACTOR_GET_POSITION_DESC"),
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
};
