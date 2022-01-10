const l10n = require("../helpers/l10n").default;

const id = "EVENT_TEXT";
const groups = ["EVENT_GROUP_DIALOGUE"];

const autoLabel = (fetchArg, args) => {
  if (([].concat(args.text) || []).join()) {
    return l10n("EVENT_TEXT_LABEL", {
      text: fetchArg("text"),
    });
  } else {
    l10n("EVENT_TEXT");
  }
};

const fields = [
  {
    key: "text",
    type: "textarea",
    placeholder: l10n("FIELD_TEXT_PLACEHOLDER"),
    multiple: true,
    defaultValue: "",
    flexBasis: "100%",
  },
  {
    key: "avatarId",
    type: "avatar",
    toggleLabel: l10n("FIELD_ADD_TEXT_AVATAR"),
    label: l10n("FIELD_TEXT_AVATAR"),
    defaultValue: "",
    optional: true,
  },
];

const compile = (input, helpers) => {
  const { textDialogue } = helpers;
  textDialogue(input.text || " ", input.avatarId);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
