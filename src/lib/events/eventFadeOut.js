const l10n = require("../helpers/l10n").default;

const id = "EVENT_FADE_OUT";
const groups = ["EVENT_GROUP_SCREEN", "EVENT_GROUP_CAMERA"];
const subGroups = {
  "EVENT_GROUP_CAMERA": "EVENT_GROUP_SCREEN"
}

const fields = [
  {
    key: "speed",
    label: l10n("FIELD_SPEED"),
    description: l10n("FIELD_SPEED_FADE_DESC"),
    type: "fadeSpeed",
    defaultValue: "2",
  },
];

const compile = (input, helpers) => {
  const { fadeOut } = helpers;
  fadeOut(input.speed);
};

module.exports = {
  id,
  description: l10n("EVENT_FADE_OUT_DESC"),
  groups,
  subGroups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
