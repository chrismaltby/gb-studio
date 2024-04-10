const l10n = require("../helpers/l10n").default;

const id = "EVENT_SCENE_RESET_STATE";
const groups = ["EVENT_GROUP_SCENE"];
const subGroups = {
  EVENT_GROUP_SCENE: "EVENT_GROUP_SCENE_STACK",
};

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
  description: l10n("EVENT_SCENE_RESET_STATE_DESC"),
  groups,
  subGroups,
  fields,
  compile,
};
