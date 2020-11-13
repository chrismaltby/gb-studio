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
  if (Array.isArray(input.text)) {
    // Handle multiple blocks of text
    for (let j = 0; j < input.text.length; j++) {
      const rowText = input.text[j];

      // Before first box, make close instant
      if (j === 0) {
        textSetCloseInstant();
      }
      // Before last box, restore close speed
      if (j === input.text.length - 1) {
        textRestoreCloseSpeed();
      }

      textDialogue(rowText || " ", input.avatarId);

      // After first box, make open instant
      if (j === 0) {
        textSetOpenInstant();
      }
      // After last box, restore open speed
      if (j === input.text.length - 1) {
        textRestoreOpenSpeed();
      }
    }
  } else {
    textDialogue(input.text || " ", input.avatarId);
  }
};

module.exports = {
  id,
  fields,
  compile
};
