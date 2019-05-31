import l10n from "../helpers/l10n";

export const id = "EVENT_OVERLAY_MOVE_TO";

export const fields = [
  {
    key: "x",
    label: l10n("FIELD_X"),
    type: "number",
    min: 0,
    max: 20,
    defaultValue: 0,
    width: "50%"
  },
  {
    key: "y",
    label: l10n("FIELD_Y"),
    type: "number",
    min: 0,
    max: 18,
    defaultValue: 0,
    width: "50%"
  },
  {
    key: "speed",
    type: "cameraSpeed",
    defaultValue: "0"
  }
];

export const compile = (input, helpers) => {
  const { overlayMoveTo } = helpers;
  overlayMoveTo(input.x, input.y, input.speed);
};
