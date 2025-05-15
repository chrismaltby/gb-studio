const l10n = require("../helpers/l10n").default;

const id = "EVENT_SWITCH_SCENE";
const groups = ["EVENT_GROUP_SCENE"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_SWITCH_SCENE_LABEL", {
    scene: fetchArg("sceneId"),
    x: fetchArg("x"),
    y: fetchArg("y"),
  });
};

const fields = [
  {
    key: "sceneId",
    label: l10n("SCENE"),
    description: l10n("FIELD_SCENE_DESC"),
    type: "scene",
    defaultValue: "LAST_SCENE",
  },
  {
    type: "group",
    wrapItems: true,
    fields: [
      {
        key: "x",
        label: l10n("FIELD_X"),
        description: l10n("FIELD_X_SCENE_DESC"),
        type: "value",
        min: 0,
        max: 255,
        defaultValue: {
          type: "number",
          value: 0,
        },
        width: "50%",
      },
      {
        key: "y",
        label: l10n("FIELD_Y"),
        description: l10n("FIELD_Y_SCENE_DESC"),
        type: "value",
        min: 0,
        max: 255,
        defaultValue: {
          type: "number",
          value: 0,
        },
        width: "50%",
      },
    ],
  },
  {
    key: "direction",
    label: l10n("FIELD_DIRECTION"),
    description: l10n("FIELD_DIRECTION_SCENE_DESC"),
    type: "direction",
    width: "50%",
    defaultValue: "",
  },
  {
    key: "fadeSpeed",
    label: l10n("FIELD_FADE_SPEED"),
    description: l10n("FIELD_SPEED_FADE_DESC"),
    type: "fadeSpeed",
    allowNone: true,
    defaultValue: "2",
    width: "50%",
  },
];

const compile = (input, helpers) => {
  const { sceneSwitchUsingScriptValues } = helpers;
  sceneSwitchUsingScriptValues(
    input.sceneId,
    input.x,
    input.y,
    input.direction,
    input.fadeSpeed
  );
};

module.exports = {
  id,
  description: l10n("EVENT_SWITCH_SCENE_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
};
