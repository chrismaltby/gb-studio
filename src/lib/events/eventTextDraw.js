const l10n = require("../helpers/l10n").default;

const id = "EVENT_TEXT_DRAW";
const groups = ["EVENT_GROUP_DIALOGUE"];

const autoLabel = (fetchArg, args) => {
  if (([].concat(args.text) || []).join()) {
    return l10n("EVENT_TEXT_DRAW_LABEL", {
      text: fetchArg("text"),
    });
  } else {
    l10n("EVENT_TEXT_DRAW");
  }
};

const fields = [
  {
    key: "text",
    type: "textarea",
    placeholder: l10n("FIELD_TEXT_PLACEHOLDER"),
    multiple: false,
    defaultValue: "",
    flexBasis: "100%",
  },
  {
    key: `x`,
    label: l10n("FIELD_X"),
    description: l10n("FIELD_X_DESC"),
    type: "number",
    min: 0,
    max: 19,
    width: "50%",
    defaultValue: 1,
  },
  {
    key: `y`,
    label: l10n("FIELD_Y"),
    description: l10n("FIELD_Y_DESC"),
    type: "number",
    min: 0,
    max: 17,
    width: "50%",
    defaultValue: 1,
  },
  {
    key: `location`,
    label: l10n("FIELD_LOCATION"),
    description: l10n("FIELD_TEXT_DRAW_LOCATION_DESC"),
    type: "select",
    defaultValue: "background",
    width: "50%",
    options: [
      ["background", l10n("FIELD_BACKGROUND")],
      ["overlay", l10n("FIELD_OVERLAY")],
    ],
  },
];

const compile = (input, helpers) => {
  const { textDraw } = helpers;
  textDraw(input.text, input.x, input.y, input.location);
};

module.exports = {
  id,
  description: l10n("EVENT_TEXT_DRAW_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: false,
  helper: {
    type: "textdraw",
    text: "text",
    x: "x",
    y: "y",
    location: "location",
  },
};
