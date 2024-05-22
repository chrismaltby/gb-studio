const l10n = require("../helpers/l10n").default;

const id = "EVENT_OVERLAY_MOVE_TO";
const groups = ["EVENT_GROUP_SCREEN"];
const subGroups = {
  EVENT_GROUP_SCREEN: "EVENT_GROUP_OVERLAY",
};

const fields = [
  {
    type: "group",
    fields: [
      {
        key: "x",
        label: l10n("FIELD_X"),
        description: l10n("FIELD_X_DESC"),
        type: "number",
        min: 0,
        max: 20,
        defaultValue: 0,
        width: "50%",
      },
      {
        key: "y",
        label: l10n("FIELD_Y"),
        description: l10n("FIELD_Y_DESC"),
        type: "number",
        min: 0,
        max: 18,
        defaultValue: 0,
        width: "50%",
      },
    ],
  },
  {
    key: "speed",
    label: l10n("FIELD_SPEED"),
    description: l10n("FIELD_SPEED_DESC"),
    type: "cameraSpeed",
    defaultValue: "0",
  },
];

const compile = (input, helpers) => {
  const { overlayMoveTo } = helpers;
  overlayMoveTo(input.x, input.y, input.speed);
};

module.exports = {
  id,
  description: l10n("EVENT_OVERLAY_MOVE_TO_DESC"),
  groups,
  subGroups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
  helper: {
    type: "overlay",
    x: "x",
    y: "y",
  },
};
