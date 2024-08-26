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
      behavior: l10n("FIELD_BEHAVIOR"),
      presets: l10n("FIELD_PRESETS"),
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
    label: l10n("FIELD_POSITION"),
    description: l10n("FIELD_DIALOGUE_POSITION_DESC"),
    type: "select",
    defaultValue: "bottom",
    options: [
      ["bottom", l10n("FIELD_BOTTOM")],
      ["top", l10n("FIELD_TOP")],
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
        label: l10n("FIELD_MIN_HEIGHT"),
        description: l10n("FIELD_DIALOGUE_MIN_HEIGHT_DESC"),
        type: "number",
        min: 1,
        max: 18,
        width: "50%",
        defaultValue: 4,
      },
      {
        key: `maxHeight`,
        label: l10n("FIELD_MAX_HEIGHT"),
        description: l10n("FIELD_DIALOGUE_MAX_HEIGHT_DESC"),
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
    wrapItems: true,
    conditions: [
      {
        key: "__section",
        in: ["layout"],
      },
    ],
    fields: [
      {
        key: `textX`,
        label: l10n("FIELD_TEXT_X"),
        description: l10n("FIELD_TEXT_X_DESC"),
        type: "number",
        min: -20,
        max: 20,
        defaultValue: 1,
        width: "50%",
      },
      {
        key: `textY`,
        label: l10n("FIELD_TEXT_Y"),
        description: l10n("FIELD_TEXT_Y_DESC"),
        type: "number",
        min: -18,
        max: 18,
        defaultValue: 1,
        width: "50%",
      },
      {
        key: `textHeight`,
        label: l10n("FIELD_TEXT_SCROLL_HEIGHT"),
        description: l10n("FIELD_TEXT_SCROLL_HEIGHT_DESC"),
        type: "number",
        min: 1,
        max: 18,
        defaultValue: 5,
        width: "50%",
      },
    ],
  },
  {
    type: "group",
    alignBottom: true,
    conditions: [
      {
        key: "__section",
        in: ["layout"],
      },
    ],
    fields: [
      {
        key: `clearPrevious`,
        label: l10n("FIELD_CLEAR_PREVIOUS"),
        description: l10n("FIELD_CLEAR_PREVIOUS_DESC"),
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
        label: l10n("FIELD_SHOW_FRAME"),
        description: l10n("FIELD_SHOW_FRAME_DESC"),
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
    alignBottom: true,
    conditions: [
      {
        key: "__section",
        in: ["behavior"],
      },
    ],
    fields: [
      {
        label: l10n("TEXT_SPEED_IN"),
        description: l10n("TEXT_SPEED_IN_DESC"),
        key: "speedIn",
        type: "cameraSpeed",
        defaultValue: -1,
        width: "50%",
        allowDefault: true,
        conditions: [
          {
            key: "__section",
            in: ["behavior"],
          },
        ],
      },
      {
        label: l10n("TEXT_SPEED_OUT"),
        description: l10n("TEXT_SPEED_OUT_DESC"),
        key: "speedOut",
        type: "cameraSpeed",
        defaultValue: -1,
        width: "50%",
        allowDefault: true,
        conditions: [
          {
            key: "__section",
            in: ["behavior"],
          },
        ],
      },
    ],
  },
  {
    key: `closeWhen`,
    label: l10n("FIELD_CLOSE_WHEN"),
    description: l10n("FIELD_CLOSE_WHEN_DESC"),
    type: "select",
    defaultValue: "key",
    options: [
      ["key", l10n("FIELD_BUTTON_PRESSED")],
      ["text", l10n("FIELD_TEXT_FINISHED")],
      ["notModal", l10n("FIELD_NEVER_NONMODAL")],
    ],
    conditions: [
      {
        key: "__section",
        in: ["behavior"],
      },
    ],
  },
  {
    label: l10n("FIELD_NONMODAL_POSITION_TOP_WARNING"),
    labelVariant: "warning",
    flexBasis: "100%",
    conditions: [
      {
        key: "__section",
        in: ["layout", "behavior"],
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
        in: ["layout", "behavior"],
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
        label: l10n("EVENT_OVERLAY_SET_SCANLINE_CUTOFF"),
        defaultValue: {
          id: "EVENT_OVERLAY_SET_SCANLINE_CUTOFF",
          values: {
            y: { type: "number", value: 150 },
            units: "pixels",
          },
        },
        width: "50%",
      },
    ],
  },
  {
    key: "closeButton",
    type: "togglebuttons",
    alignBottom: true,
    options: [
      ["a", "A"],
      ["b", "B"],
      ["any", l10n("FIELD_ANY")],
    ],
    allowNone: false,
    defaultValue: "a",
    conditions: [
      {
        key: "__section",
        in: ["behavior"],
      },
      {
        key: "closeWhen",
        in: ["key", undefined],
      },
    ],
  },
  {
    key: "closeDelayTime",
    label: l10n("FIELD_CLOSE_DELAY"),
    description: l10n("FIELD_CLOSE_DELAY_DESC"),
    type: "number",
    min: 0,
    max: 3600,
    step: 0.1,
    defaultValue: 0.5,
    unitsField: "closeDelayUnits",
    unitsDefault: "time",
    unitsAllowed: ["time", "frames"],
    conditions: [
      {
        key: "__section",
        in: ["behavior"],
      },
      {
        key: "closeDelayUnits",
        ne: "frames",
      },
      {
        key: "closeWhen",
        in: ["text"],
      },
    ],
  },
  {
    key: "closeDelayFrames",
    label: l10n("FIELD_CLOSE_DELAY"),
    description: l10n("FIELD_CLOSE_DELAY_DESC"),
    type: "number",
    min: 0,
    max: 3600,
    defaultValue: 30,
    unitsField: "closeDelayUnits",
    unitsDefault: "time",
    unitsAllowed: ["time", "frames"],
    conditions: [
      {
        key: "__section",
        in: ["behavior"],
      },
      {
        key: "closeDelayUnits",
        eq: "frames",
      },
      {
        key: "closeWhen",
        in: ["text"],
      },
    ],
  },
  {
    type: "presets",
    conditions: [
      {
        key: "__section",
        in: ["presets"],
      },
    ],
  },
];

const userPresetsGroups = [
  {
    label: l10n("FIELD_TEXT"),
    fields: ["text"],
  },
  {
    label: l10n("FIELD_TEXT_AVATAR"),
    fields: ["avatarId"],
  },
  {
    label: l10n("FIELD_LAYOUT"),
    fields: [
      "position",
      "minHeight",
      "maxHeight",
      "textX",
      "textY",
      "textHeight",
      "clearPrevious",
      "showFrame",
    ],
    selected: true,
  },
  {
    label: l10n("FIELD_BEHAVIOR"),
    fields: [
      "speedIn",
      "speedOut",
      "closeWhen",
      "closeButton",
      "closeDelayTime",
      "closeDelayFrames",
    ],
    selected: true,
  },
];

const userPresetsIgnore = ["__section"];

const compile = (input, helpers) => {
  const { textDialogue } = helpers;
  let closeDelayFrames = 0;
  if (input.closeDelayUnits === "frames") {
    closeDelayFrames =
      typeof input.closeDelayFrames === "number" ? input.closeDelayFrames : 30;
  } else {
    const seconds =
      typeof input.closeDelayTime === "number" ? input.closeDelayTime : 0.5;
    closeDelayFrames = Math.ceil(seconds * 60);
  }
  const convertSpeed = (value) => {
    if (value > 0) {
      return value - 1;
    }
    if (value === 0) {
      return -3;
    }
    return -1;
  };
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
    convertSpeed(input.speedIn),
    convertSpeed(input.speedOut),
    input.closeWhen ?? "key",
    input.closeButton ?? "a",
    closeDelayFrames
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
  userPresetsGroups,
  userPresetsIgnore,
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
