const l10n = require("../helpers/l10n").default;

const id = "EVENT_SCENE_UPDATE_PAUSE";
const groups = [
  "EVENT_GROUP_CONTROL_FLOW",
  "EVENT_GROUP_SCENE",
  "EVENT_GROUP_MISC",
];
const subGroups = {
  EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_THREADS",
  EVENT_GROUP_MISC: "EVENT_GROUP_THREADS",
  EVENT_GROUP_SCENE: "EVENT_GROUP_THREADS",
};

const fields = [
  {
    label: l10n("EVENT_SCENE_UPDATE_PAUSE_DESC"),
  },
];

const compile = (input, helpers) => {
  const { sceneUpdatePause } = helpers;
  sceneUpdatePause();
};

module.exports = {
  id,
  description: l10n("EVENT_SCENE_UPDATE_PAUSE_DESC"),
  groups,
  subGroups,
  fields,
  compile,
};
