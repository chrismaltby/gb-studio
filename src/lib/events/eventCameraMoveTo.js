const l10n = require("../helpers/l10n").default;

const id = "EVENT_CAMERA_MOVE_TO";
const groups = ["EVENT_GROUP_CAMERA"];

const autoLabel = (fetchArg) => {
  return l10n("FIELD_CAMERA_MOVE_TO_LABEL", {
    x: fetchArg("x"),
    y: fetchArg("y"),
  });
};

const fields = [
  {
    key: "x",
    label: l10n("FIELD_X"),
    type: "number",
    min: 0,
    max: 255,
    width: "50%",
    defaultValue: 0,
  },
  {
    key: "y",
    label: l10n("FIELD_Y"),
    type: "number",
    min: 0,
    max: 255,
    width: "50%",
    defaultValue: 0,
  },
  {
    key: "speed",
    type: "cameraSpeed",
    defaultValue: 0,
  },
];

const compile = (input, helpers) => {
  const { cameraMoveTo } = helpers;
  cameraMoveTo(input.x, input.y, Number(input.speed));
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};
