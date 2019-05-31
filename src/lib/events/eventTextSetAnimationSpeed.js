import l10n from "../helpers/l10n";

export const id = "EVENT_TEXT_SET_ANIMATION_SPEED";

export const fields = [
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
  }
];

export const compile = (input, helpers) => {
  const { textSetAnimSpeed } = helpers;
  textSetAnimSpeed(input.speedIn, input.speedOut, input.speed);
};
