const l10n = require("../helpers/l10n").default;

const id = "EVENT_OVERLAY_MOVE_TO";
const groups = ["EVENT_GROUP_SCREEN"];

const fields = [
  {
    key: "x",
    label: l10n("FIELD_X"),
    type: "number",
    min: 0,
    max: 20,
    defaultValue: 0,
    width: "50%",
  },
  {
    key: "y",
    label: l10n("FIELD_Y"),
    type: "number",
    min: 0,
    max: 18,
    defaultValue: 0,
    width: "50%",
  },
  {
    key: "speed",
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
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
