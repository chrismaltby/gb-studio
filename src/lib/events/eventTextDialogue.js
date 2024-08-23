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
    key: "__section",
    type: "tabs",
    defaultValue: "text",
    variant: "eventSection",
    values: {
      text: l10n("FIELD_TEXT"),
      layout: l10n("FIELD_LAYOUT"),
    },
  },

  // Text Section

  {
    key: "text",
    type: "textarea",
    placeholder: l10n("FIELD_TEXT_PLACEHOLDER"),
    multiple: true,
    defaultValue: "",
    flexBasis: "100%",
    conditions: [
      {
        key: "__section",
        in: ["text", undefined],
      },
    ],
  },
  {
    key: "avatarId",
    type: "avatar",
    toggleLabel: l10n("FIELD_ADD_TEXT_AVATAR"),
    label: l10n("FIELD_TEXT_AVATAR"),
    description: l10n("FIELD_TEXT_AVATAR_DESC"),
    defaultValue: "",
    optional: true,
    conditions: [
      {
        key: "__section",
        in: ["text", undefined],
      },
    ],
  },

  // Layout Section

  {
    type: "group",
    conditions: [
      {
        key: "__section",
        in: ["layout"],
      },
    ],
    fields: [
      {
        key: `minHeight`,
        label: "Min Height",
        type: "number",
        min: 1,
        max: 18,
        width: "50%",
        defaultValue: 4,
      },
      {
        key: `maxHeight`,
        label: "Max Height",
        type: "number",
        min: 1,
        max: 18,
        width: "50%",
        defaultValue: 7,
      },
    ],
  },
  {
    key: `position`,
    label: "Position",
    type: "select",
    defaultValue: "bottom",
    options: [
      ["bottom", "Bottom"],
      ["top", "Top"],
    ],
    conditions: [
      {
        key: "__section",
        in: ["layout"],
      },
    ],
  },
  {
    label:
      "⚠️ Displaying the dialogue on top won't work in scenes with parallax.",
    conditions: [
      {
        key: "__section",
        in: ["layout"],
      },
      {
        key: "position",
        eq: "top",
      },
      {
        parallaxEnabled: true,
      },
    ],
  },
  {
    type: "group",
    conditions: [
      {
        key: "__section",
        in: ["layout"],
      },
    ],
    fields: [
      {
        key: `clearPrevious`,
        label: "Clear Previous Content",
        type: "checkbox",
        defaultValue: true,
        width: "50%",
        conditions: [
          {
            key: "__section",
            in: ["layout"],
          },
        ],
      },
      {
        key: `showFrame`,
        label: "Show Frame",
        type: "checkbox",
        defaultValue: "true",
        width: "50%",
        conditions: [
          {
            key: "__section",
            in: ["layout"],
          },
          {
            key: "clearPrevious",
            in: [true, undefined],
          },
        ],
      },
    ],
  },
  {
    type: "group",
    conditions: [
      {
        key: "__section",
        in: ["layout"],
      },
    ],
    fields: [
      {
        key: `textX`,
        label: "Text X",
        type: "number",
        min: -20,
        max: 20,
        defaultValue: 1,
      },
      {
        key: `textY`,
        label: "Text Y",
        type: "number",
        min: -18,
        max: 18,
        defaultValue: 1,
      },
      {
        key: `textHeight`,
        label: "Text Max Height",
        type: "number",
        min: 1,
        max: 18,
        defaultValue: 5,
      },
    ],
  },
  {
    key: `closeWhen`,
    label: "Close When...",
    type: "select",
    defaultValue: "key",
    options: [
      ["key", "Button Pressed"],
      ["text", "Text Finishes"],
      ["notModal", "Never (Non-Modal)"],
    ],
    conditions: [
      {
        key: "__section",
        in: ["layout"],
      },
    ],
  },
  {
    label:
      '⚠️ Don\'t forget to reset "overlay_cut_scanline" after manually closing a non-modal dialogue displaying on top.',
    conditions: [
      {
        key: "__section",
        in: ["layout"],
      },
      {
        key: "position",
        eq: "top",
      },
      {
        key: "closeWhen",
        eq: "notModal",
      },
    ],
  },
  {
    key: "closeButton",
    type: "togglebuttons",
    options: [
      ["a", "A"],
      ["b", "B"],
      ["any", "Any"],
    ],
    allowNone: false,
    defaultValue: "a",
    conditions: [
      {
        key: "__section",
        in: ["layout"],
      },
      {
        key: "closeWhen",
        in: ["key", undefined],
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { textDialogue } = helpers;
  textDialogue(
    input.text || " ",
    input.avatarId,
    input.minHeight ?? 4,
    input.maxHeight ?? 7,
    input.position ?? "bottom",
    input.showFrame ?? true,
    input.clearPrevious ?? true,
    input.textX ?? 1,
    input.textY ?? 1,
    input.textHeight ?? 5,
    input.closeWhen ?? "key",
    input.closeButton ?? "a"
  );
};

module.exports = {
  id,
  description: l10n("EVENT_TEXT_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
  helper: {
    type: "text",
    text: "text",
    avatarId: "avatarId",
    minHeight: "minHeight",
    maxHeight: "maxHeight",
    showFrame: "showFrame",
    clearPrevious: "clearPrevious",
    textX: "textX",
    textY: "textY",
    textHeight: "textHeight",
  },
};
