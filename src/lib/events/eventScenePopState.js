const l10n = require("../helpers/l10n").default;

const id = "EVENT_SCENE_POP_STATE";
const groups = ["EVENT_GROUP_SCENE"];

const fields = [
  {
    label: l10n("FIELD_SCENE_POP_STATE_DESCRIPTION"),
  },
  {
    type: "break",
  },
  {
    key: "fadeSpeed",
    label: l10n("FIELD_FADE_SPEED"),
    description: l10n("FIELD_SPEED_FADE_DESC"),
    type: "fadeSpeed",
    defaultValue: "2",
    width: "50%",
  },
];

const compile = (input, helpers) => {
  const { scenePopState, scriptEnd } = helpers;
  scenePopState(input.fadeSpeed);
  scriptEnd();
};

module.exports = {
  id,
  description: l10n("EVENT_SCENE_POP_STATE_DESC"),
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
