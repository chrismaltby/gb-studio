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
      {
        parallaxEnabled: false,
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
      'To close a non-modal dialog positioned at the top of the screen, you can use a "Close Non-Modal Dialogue" event or you will need to manually reset the overlay draw with a "Set Overlay Draw Area" event.',
    labelVariant: "warning",
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
      {
        parallaxEnabled: false,
      },
    ],
  },
  {
    type: "group",
    wrapItems: true,
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
      {
        parallaxEnabled: false,
      },
    ],
    fields: [
      {
        type: "addEventButton",
        hideLabel: true,
        label: l10n("EVENT_DIALOGUE_CLOSE_NONMODAL"),
        defaultValue: {
          id: "EVENT_DIALOGUE_CLOSE_NONMODAL",
        },
        width: "50%",
      },
      {
        type: "addEventButton",
        hideLabel: true,
        label: l10n("EVENT_OVERLAY_SET_DRAW_AREA"),
        defaultValue: {
          id: "EVENT_OVERLAY_SET_DRAW_AREA",
          values: {
            height: { type: "number", value: 18 },
            units: "tiles",
          },
        },
        width: "50%",
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
