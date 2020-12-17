const trimlines = require("../helpers/trimlines");
const l10n = require("../helpers/l10n").default;

const id = "EVENT_TEXT";

const fields = [
  {
    key: "text",
    type: "textarea",
    placeholder: l10n("FIELD_TEXT_PLACEHOLDER"),
    updateFn: (string, field, args) => {
      const maxPerLine = args.avatarId ? 16 : 18;
      const maxTotal = args.avatarId ? 48 : 52;
      return trimlines(string, maxPerLine, 4, maxTotal);
    },
    multiple: true,
    defaultValue: ""
  },
  {
    key: "avatarId",
    type: "sprite",
    toggleLabel: l10n("FIELD_ADD_TEXT_AVATAR"),
    label: l10n("FIELD_TEXT_AVATAR"),
    defaultValue: "",
    optional: true,
    filter: sprite => sprite.numFrames === 1,
    postUpdate: (args) => {
      const maxPerLine = args.avatarId ? 16 : 18;
      const maxTotal = args.avatarId ? 48 : 52;
      return {
        ...args,
        text: Array.isArray(args.text)
          ? args.text.map(string => trimlines(string, maxPerLine, 4, maxTotal))
          : trimlines(args.text, maxPerLine, 4, maxTotal)
      };
    }
  }
];

const compile = (input, helpers) => {
  const {
    textDialogue,
    textSetOpenInstant,
    textSetCloseInstant,
    textRestoreOpenSpeed,
    textRestoreCloseSpeed
  } = helpers;
  textDialogue(input.text || " ", input.avatarId);
};

module.exports = {
  id,
  fields,
  compile
};
