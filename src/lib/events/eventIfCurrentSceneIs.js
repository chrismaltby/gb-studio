const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_CURRENT_SCENE_IS";
const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_SCENE"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_IF_CURRENT_SCENE_IS_LABEL", {
    scene: fetchArg("sceneId"),
  });
};

const fields = [
  {
    key: "sceneId",
    label: l10n("SCENE"),
    type: "scene",
    defaultValue: "LAST_SCENE",
  },
  {
    key: "true",
    label: l10n("FIELD_TRUE"),
    type: "events",
  },
  {
    key: "__collapseElse",
    label: l10n("FIELD_ELSE"),
    type: "collapsable",
    defaultValue: true,
    conditions: [
      {
        key: "__disableElse",
        ne: true,
      },
    ],
  },
  {
    key: "false",
    label: l10n("FIELD_FALSE"),
    conditions: [
      {
        key: "__collapseElse",
        ne: true,
      },
      {
        key: "__disableElse",
        ne: true,
      },
    ],
    type: "events",
  },
];

const compile = (input, helpers) => {
  const { ifCurrentSceneIs } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  ifCurrentSceneIs(input.sceneId, truePath, falsePath);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};
