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
  let speedText = 10;
  switch(Math.round(input.speed)) {
    case 0: speedText = 0x0;  break;
    case 1: speedText = 0x1;  break;
    case 2: speedText = 0x3;  break;
    case 3: speedText = 0x7;  break;
    case 4: speedText = 0xF;  break;
    case 5: speedText = 0x1F; break;
    default: speedText = 0x1; break;
  }
  let joypadFF = (input.joypadFF ? 0x20 : 0x0);
  textSetAnimSpeed(input.speedIn, input.speedOut, speedText, joypadFF);
};

module.exports = {
  id,
  fields,
  compile
};
