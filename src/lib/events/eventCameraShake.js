import l10n from "../helpers/l10n";

export const id = "EVENT_CAMERA_SHAKE";

export const fields = [
  {
    key: "time",
    type: "number",
    label: l10n("FIELD_SECONDS"),
    min: 0,
    max: 10,
    step: 0.1,
    defaultValue: 0.5
  }
];

export const compile = (input, helpers) => {
  const { cameraShake } = helpers;
  let seconds = typeof input.time === "number" ? input.time : 0.5;
  // Convert seconds into frames (60fps)
  while (seconds > 0) {
    const time = Math.min(seconds, 1);
    cameraShake(Math.ceil(60 * time));
    seconds -= time;
  }
};
