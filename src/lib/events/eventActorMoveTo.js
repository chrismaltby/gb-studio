const l10n = require("../helpers/l10n").default;

const id = "EVENT_ACTOR_MOVE_TO";
const groups = ["EVENT_GROUP_ACTOR"];
const subGroups = {
  EVENT_GROUP_ACTOR: "EVENT_GROUP_MOVEMENT",
};
const weight = 2;

const autoLabel = (fetchArg, input) => {
  const unitPostfix =
    input.units === "pixels" ? l10n("FIELD_PIXELS_SHORT") : "";
  return l10n("EVENT_ACTOR_MOVE_TO_LABEL", {
    actor: fetchArg("actorId"),
    x: `${fetchArg("x")}${unitPostfix}`,
    y: `${fetchArg("y")}${unitPostfix}`,
  });
};

const fields = [
  {
    key: "__section",
    type: "tabs",
    defaultValue: "movement",
    variant: "eventSection",
    values: {
      movement: l10n("FIELD_MOVEMENT"),
      options: l10n("FIELD_OPTIONS"),
      presets: l10n("FIELD_PRESETS"),
    },
  },
  {
    type: "group",
    wrapItems: true,
    flexBasis: "100%",
    fields: [
      {
        key: "actorId",
        label: l10n("ACTOR"),
        description: l10n("FIELD_ACTOR_MOVE_DESC"),
        type: "actor",
        defaultValue: "$self$",
        flexBasis: 0,
        minWidth: 150,
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
            unitsField: "units",
            unitsDefault: "tiles",
            unitsAllowed: ["tiles", "pixels"],
            defaultValue: {
              type: "number",
              value: 0,
            },
          },
          {
            key: "y",
            label: l10n("FIELD_Y"),
            description: l10n("FIELD_Y_DESC"),
            type: "value",
            min: 0,
            max: 255,
            width: "50%",
            unitsField: "units",
            unitsDefault: "tiles",
            unitsAllowed: ["tiles", "pixels"],
            defaultValue: {
              type: "number",
              value: 0,
            },
          },
        ],
      },
    ],
    conditions: [
      {
        key: "__section",
        in: ["movement", undefined],
      },
    ],
  },
  {
    type: "group",
    wrapItems: true,
    flexBasis: "100%",
    fields: [
      {
        key: "collideWith",
        width: "50%",
        flexBasis: 0,
        minWidth: 150,
        label: l10n("FIELD_COLLIDE_WITH"),
        description: l10n("FIELD_COLLIDE_WITH_DESC"),
        type: "togglebuttons",
        options: [
          ["walls", `${l10n("FIELD_WALLS")}`, `${l10n("FIELD_WALLS")}`],
          ["actors", `${l10n("FIELD_ACTORS")}`, `${l10n("FIELD_ACTORS")}`],
        ],
        allowNone: true,
        allowMultiple: true,
        defaultValue: ["walls"],
      },
      {
        type: "group",
        flexBasis: 0,
        minWidth: 150,
        alignBottom: true,
        fields: [
          {
            key: "lockDirection",
            width: "50%",
            label: l10n("FIELD_LOCK_DIRECTION"),
            description: l10n("FIELD_LOCK_DIRECTION_DESC"),
            type: "togglebuttons",
            options: [
              ["x", "H", l10n("FIELD_HORIZONTAL")],
              ["y", "V", l10n("FIELD_VERTICAL")],
            ],
            allowMultiple: true,
            allowNone: true,
            defaultValue: [],
          },
          {
            key: "moveType",
            label: l10n("FIELD_MOVE_TYPE"),
            description: l10n("FIELD_MOVE_TYPE_DESC"),
            hideLabel: true,
            type: "moveType",
            defaultValue: "horizontal",
            flexBasis: 35,
            flexGrow: 0,
            alignBottom: true,
          },
        ],
      },
    ],
    conditions: [
      {
        key: "__section",
        in: ["options"],
      },
    ],
  },
  {
    type: "presets",
    conditions: [
      {
        key: "__section",
        in: ["presets"],
      },
    ],
  },
];

const userPresetsGroups = [
  {
    id: "movement",
    label: l10n("FIELD_MOVEMENT"),
    fields: ["x", "y"],
  },
  {
    id: "units",
    label: l10n("FIELD_UNITS"),
    fields: ["units"],
  },
  {
    id: "options",
    label: l10n("FIELD_OPTIONS"),
    fields: ["collideWith", "lockDirection", "moveType"],
    selected: true,
  },
];

const userPresetsIgnore = ["__section", "actorId"];

const compile = (input, helpers) => {
  const { actorMoveToScriptValues } = helpers;
  actorMoveToScriptValues(
    input.actorId,
    input.x,
    input.y,
    input.collideWith,
    input.moveType,
    input.units,
    input.lockDirection,
  );
};

module.exports = {
  id,
  description: l10n("EVENT_ACTOR_MOVE_TO_DESC"),
  autoLabel,
  groups,
  subGroups,
  weight,
  fields,
  compile,
  waitUntilAfterInitFade: true,
  userPresetsGroups,
  userPresetsIgnore,
  helper: {
    type: "position",
    x: "x",
    y: "y",
    units: "units",
    tileWidth: 2,
  },
};
