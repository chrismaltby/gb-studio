const l10n = require("../helpers/l10n").default;

const id = "EVENT_CAMERA_SHAKE";

const fields = [
  {
    key: "time",
    type: "number",
    label: l10n("FIELD_SECONDS"),
    width: "50%",
    min: 0,
    max: 10,
    step: 0.1,
    defaultValue: 0.5,
  },
  {
    key: "shakeDirection",
    label: l10n("FIELD_DIRECTION"),
    width: "50%",
    type: "select",
    options: [
      ["horizontal", "↔ " + l10n("FIELD_HORIZONTAL")],
      ["vertical", "↕ " + l10n("FIELD_VERTICAL")],
      ["diagonal", "⤡ " + l10n("FIELD_DIAGONAL")],
    ],
    defaultValue: "horizontal",
  },
];

const compile = (input, helpers) => {
  const { cameraShake } = helpers;
  let seconds = typeof input.time === "number" ? input.time : 0.5;
  const shakeDirection = input.shakeDirection;
  let shouldShakeX = true;
  let shouldShakeY = false;
  switch (shakeDirection) {
    case "horizontal":
      shouldShakeX = true;
      shouldShakeY = false;
      break;
    case "vertical":
      shouldShakeX = false;
      shouldShakeY = true;
      break;
    case "diagonal":
      shouldShakeX = true;
      shouldShakeY = true;
      break;
    default:
      shouldShakeX = true;
      shouldShakeY = false;
  }
  // Convert seconds into frames (60fps)
  while (seconds > 0) {
    const time = Math.min(seconds, 1);
    cameraShake(shouldShakeX, shouldShakeY, Math.ceil(60 * time));
    seconds -= time;
  }
};

module.exports = {
  id,
  fields,
  compile,
};
