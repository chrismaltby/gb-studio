const l10n = require("../helpers/l10n").default;

const id = "EVENT_OVERLAY_SHOW";
const groups = ["EVENT_GROUP_SCREEN"];
const subGroups = {
  EVENT_GROUP_SCREEN: "EVENT_GROUP_OVERLAY",
};

const fields = [
  {
    key: "color",
    label: l10n("FIELD_FILL_COLOR"),
    description: l10n("FIELD_FILL_COLOR_OVERLAY_DESC"),
    type: "overlayColor",
    defaultValue: "black",
  },
  {
    type: "group",
    fields: [
      {
        key: "x",
        label: l10n("FIELD_X"),
        description: l10n("FIELD_X_DESC"),
        type: "number",
        min: 0,
        max: 20,
        defaultValue: 0,
        width: "50%",
      },
      {
        key: "y",
        label: l10n("FIELD_Y"),
        description: l10n("FIELD_Y_DESC"),
        type: "number",
        min: 0,
        max: 18,
        defaultValue: 0,
        width: "50%",
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { overlayShow } = helpers;
  overlayShow(input.color, input.x, input.y);
};

module.exports = {
  id,
  description: l10n("EVENT_OVERLAY_SHOW_DESC"),
  groups,
  subGroups,
  fields,
  compile,
  helper: {
    type: "overlay",
    x: "x",
    y: "y",
    color: "color",
  },
};
