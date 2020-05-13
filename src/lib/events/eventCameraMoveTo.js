const l10n = require("../helpers/l10n");

const id = "EVENT_CAMERA_MOVE_TO";

const fields = [
  {
    key: "x",
    label: l10n("FIELD_X"),
    type: "number",
    min: 0,
    max: 12,
    width: "50%",
    defaultValue: 0
  },
  {
    key: "y",
    label: l10n("FIELD_Y"),
    type: "number",
    min: 0,
    max: 14,
    width: "50%",
    defaultValue: 0
  },
  {
    key: "speed",
    type: "cameraSpeed",
    defaultValue: "0"
  }
];

const compile = (input, helpers) => {
  const { cameraMoveTo } = helpers;
  cameraMoveTo(input.x, input.y, input.speed);
};

module.exports = {
  id,
  fields,
  compile
};
