import trimlines from "../helpers/trimlines50";
import l10n from "../helpers/l10n";

export const id = "EVENT_COMMENT";

export const fields = [
  /*{
    key: "text",
    type: "textarea",
    maxPerLine: 50,
    placeholder: l10n("FIELD_TEXT_PLACEHOLDER"),
    updateFn: trimlines,
    multiple: false,
    defaultValue: ""
  },*/
  {
    key: "true",
    type: "events"
  }
];

export const compile = (input, helpers) => {
  // Comments do not affect anything
};
