const l10n = require("../helpers/l10n").default;

const id = "EVENT_LAUNCH_PROJECTILE";

const fields = [
  {
    key: "spriteSheetId",
    type: "sprite",
    defaultValue: "LAST_SPRITE",
  },
  {
    key: "x",
    label: l10n("FIELD_X"),
    type: "number",
    min: 0,
    max: 255,
    width: "50%",
    defaultValue: 0,
  },
  {
    key: "y",
    label: l10n("FIELD_Y"),
    type: "number",
    min: 0,
    max: 255,
    width: "50%",
    defaultValue: 0,
  },
  {
    key: "direction",
    label: l10n("FIELD_DIRECTION"),
    type: "direction",
    defaultValue: "up",
  },
];

const compile = (input, helpers) => {
  const { launchProjectile } = helpers;
  launchProjectile(input.spriteSheetId, input.x, input.y);
};

module.exports = {
  id,
  fields,
  compile
};
