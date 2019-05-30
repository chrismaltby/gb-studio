import trimlines from "../helpers/trimlines";
import l10n from "../helpers/l10n";

export const id = "EVENT_TEXT";

export const fields = [
  {
    key: "text",
    type: "textarea",
    maxPerLine: 18,
    placeholder: l10n("FIELD_TEXT_PLACEHOLDER"),
    updateFn: trimlines,
    multiple: true,
    defaultValue: ""
  }
];

export const compile = (input, helpers) => {
  const {
    displayText,
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

      displayText(rowText);

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
    displayText(input.text);
  }
};
