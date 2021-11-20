const l10n = require("../helpers/l10n").default;

const id = "EVENT_TEXT_SET_ANIMATION_SPEED";
const groups = ["EVENT_GROUP_DIALOGUE"];

const fields = [
  {
    label: l10n("TEXT_SPEED_IN"),
    key: "speedIn",
    type: "cameraSpeed",
    defaultValue: 1,
    width: "50%",
  },
  {
    label: l10n("TEXT_SPEED_OUT"),
    key: "speedOut",
    type: "cameraSpeed",
    defaultValue: 1,
    width: "50%",
  },
  {
    label: l10n("TEXT_SPEED"),
    key: "speed",
    type: "cameraSpeed",
    defaultValue: 1,
  },
  {
    type: "checkbox",
    label: l10n("FIELD_ALLOW_FASTFORWARD"),
    key: "allowFastForward",
    defaultValue: true,
    alignCheckbox: true,
  },
];

const compile = (input, helpers) => {
  const { textSetAnimSpeed } = helpers;
  let speedIn = input.speedIn > 0 ? input.speedIn - 1 : -3;
  let speedOut = input.speedOut > 0 ? input.speedOut - 1 : -3;
  textSetAnimSpeed(speedIn, speedOut, input.speed, input.allowFastForward);
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
