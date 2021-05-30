const l10n = require("../helpers/l10n").default;

const id = "EVENT_SCENE_PUSH_STATE";

const fields = [
  {
    label: l10n("FIELD_SCENE_PUSH_STATE_DESCRIPTION")
  }
];

const compile = (input, helpers) => {
  const { scenePushState } = helpers;
  scenePushState();
};

module.exports = {
  id,
  fields,
  compile
};
