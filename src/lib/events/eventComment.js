import l10n from "../helpers/l10n";

export const id = "EVENT_COMMENT";

export const fields = [
  {
    key: "text",
    type: "textarea",
    maxPerLine: 50,
    placeholder: l10n("FIELD_TEXT_PLACEHOLDER"),
    multiple: false,
    defaultValue: ""
  }
];

export const compile = (input, helpers) => {};
