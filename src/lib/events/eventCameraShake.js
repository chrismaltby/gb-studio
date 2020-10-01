const l10n = require("../helpers/l10n").default;

const id = "EVENT_CAMERA_SHAKE";

const fields = [
  {
    key: "time",
    type: "number",
    label: l10n("FIELD_SECONDS"),
    min: 0,
    max: 10,
    step: 0.1,
    defaultValue: 0.5
  },
  {
    key: "shouldShakeX",
    type: "checkbox",
    label: l10n("FIELD_X"),
    defaultValue: true
  },
  {
    key: "shouldShakeY",
    type: "checkbox",
    label: l10n("FIELD_Y"),
    defaultValue: false
  }
];

const compile = (input, helpers) => {
  const { cameraShake } = helpers;
  let seconds = typeof input.time === "number" ? input.time : 0.5;
  let shouldShakeX =
    typeof input.shouldShakeX === "boolean" ? input.shouldShakeX : true;
  let shouldShakeY =
    typeof input.shouldShakeY === "boolean" ? input.shouldShakeY : false;
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
  compile
};
