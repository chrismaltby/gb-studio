const l10n = require("../helpers/l10n").default;

const id = "EVENT_TEXT_SET_ANIMATION_SPEED";
const groups = ["EVENT_GROUP_DIALOGUE"];
const subGroups = {
  EVENT_GROUP_DIALOGUE: "EVENT_GROUP_PROPERTIES",
};

const fields = [
  {
    label: l10n("TEXT_SPEED_IN"),
    description: l10n("TEXT_SPEED_IN_DESC"),
    key: "speedIn",
    type: "cameraSpeed",
    defaultValue: 1,
    width: "50%",
  },
  {
    label: l10n("TEXT_SPEED_OUT"),
    description: l10n("TEXT_SPEED_OUT_DESC"),
    key: "speedOut",
    type: "cameraSpeed",
    defaultValue: 1,
    width: "50%",
  },
  {
    label: l10n("TEXT_SPEED"),
    description: l10n("TEXT_SPEED_DESC"),
    key: "speed",
    type: "cameraSpeed",
    defaultValue: 1,
  },
  {
    type: "checkbox",
    label: l10n("FIELD_ALLOW_FASTFORWARD"),
    description: l10n("FIELD_ALLOW_FASTFORWARD_DESC"),
    key: "allowFastForward",
    defaultValue: true,
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
  description: l10n("EVENT_TEXT_SET_ANIMATION_SPEED_DESC"),
  groups,
  subGroups,
  fields,
  compile,
};
