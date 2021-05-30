const l10n = require("../helpers/l10n").default;

const id = "EVENT_SWITCH_SCENE";

const fields = [
  {
    key: "sceneId",
    type: "scene",
    defaultValue: "LAST_SCENE"
  },
  {
    key: "x",
    label: l10n("FIELD_X"),
    type: "number",
    min: 0,
    max: 255,
    defaultValue: 0,
    width: "50%"
  },
  {
    key: "y",
    label: l10n("FIELD_Y"),
    type: "number",
    min: 0,
    max: 255,
    defaultValue: 0,
    width: "50%"
  },
  {
    key: "direction",
    label: l10n("FIELD_DIRECTION"),
    type: "direction",
    width: "50%",
    defaultValue: ""
  },
  {
    key: "fadeSpeed",
    label: l10n("FIELD_FADE_SPEED"),
    type: "fadeSpeed",
    defaultValue: "2",
    width: "50%"
  }
];

const compile = (input, helpers) => {
  const { sceneSwitch } = helpers;
  sceneSwitch(
    input.sceneId,
    input.x,
    input.y,
    input.direction,
    input.fadeSpeed
  );
};

module.exports = {
  id,
  fields,
  compile
};
