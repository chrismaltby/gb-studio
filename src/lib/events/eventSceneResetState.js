const l10n = require("../helpers/l10n").default;

const id = "EVENT_SCENE_RESET_STATE";
const groups = ["EVENT_GROUP_SCENE"];

const fields = [
  {
    label: l10n("FIELD_SCENE_RESET_STATE_DESCRIPTION"),
  },
];

const compile = (input, helpers) => {
  const { sceneResetState } = helpers;
  sceneResetState();
};

module.exports = {
  id,
  groups,
  fields,
  compile,
};
