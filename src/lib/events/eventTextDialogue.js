const l10n = require("../helpers/l10n").default;

const id = "EVENT_TEXT";

const fields = [
  {
    key: "text",
    type: "textarea",
    placeholder: l10n("FIELD_TEXT_PLACEHOLDER"),
    multiple: true,
    defaultValue: "",
  },
  {
    key: "avatarId",
    type: "sprite",
    toggleLabel: l10n("FIELD_ADD_TEXT_AVATAR"),
    label: l10n("FIELD_TEXT_AVATAR"),
    defaultValue: "",
    optional: true,
    filter: (sprite) => sprite.numFrames === 1,
  },
];

const compile = (input, helpers) => {
  const { textDialogue } = helpers;
  textDialogue(input.text || " ", input.avatarId);
};

module.exports = {
  id,
  fields,
  compile,
};
