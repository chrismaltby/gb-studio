const l10n = require("../helpers/l10n");

const id = "EVENT_SCENE_POP_ALL_STATE";

const fields = [
  {
    label: l10n("FIELD_SCENE_POP_ALL_STATE_DESCRIPTION")
  },
  {
    key: "fadeSpeed",
    label: l10n("FIELD_FADE_SPEED"),
    type: "fadeSpeed",
    defaultValue: "2",
    width: "50%"
  }
];

const compile = (input, helpers) => {
  const { scenePopAllState, scriptEnd } = helpers;
  scenePopAllState(input.fadeSpeed);
  scriptEnd();
};

module.exports = {
  id,
  fields,
  compile
};
