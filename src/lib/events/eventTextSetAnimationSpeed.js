const l10n = require("../helpers/l10n").default;

const id = "EVENT_TEXT_SET_ANIMATION_SPEED";

const fields = [
  {
    label: l10n("TEXT_SPEED_IN"),
    key: "speedIn",
    type: "cameraSpeed",
    defaultValue: 1,
    width: "50%"
  },
  {
    label: l10n("TEXT_SPEED_OUT"),
    key: "speedOut",
    type: "cameraSpeed",
    defaultValue: 1,
    width: "50%"
  },
  {
    label: l10n("TEXT_SPEED"),
    key: "speed",
    type: "cameraSpeed",
    defaultValue: 1
  },
  {
    type: "checkbox",
    label: "Increase text draw speed if 'B' Held",
    key: "joypadFF",
    defaultValue: 1
  }
];

const compile = (input, helpers) => {
  const { textSetAnimSpeed } = helpers;
  const joypadFF = (input.joypadFF ? 0x20 : 0x0);
  textSetAnimSpeed(input.speedIn, input.speedOut, input.speed, joypadFF);
};

module.exports = {
  id,
  fields,
  compile
};
