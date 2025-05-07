const l10n = require("../helpers/l10n").default;

const id = "EVENT_PRINT";
const subGroups = {
  EVENT_GROUP_MISC: "EVENT_GROUP_PRINTER",
};

const fields = [
  {
    type: "group",
    wrapItems: true,

    fields: [
      {
        key: `source`,
        label: l10n("FIELD_PRINT_SOURCE"),
        description: l10n("FIELD_PRINT_SOURCE_DESC"),
        type: "select",
        defaultValue: "background",
        width: "50%",
        options: [
          ["background", l10n("FIELD_BACKGROUND")],
          ["overlay", l10n("FIELD_OVERLAY")],
        ],
      },
      {
        key: `margin`,
        label: l10n("FIELD_MARGIN"),
        description: l10n("FIELD_PRINT_MARGIN_DESC"),
        type: "number",
        min: 0,
        max: 20,
        width: "50%",
        defaultValue: 2,
      },
    ],
  },
  {
    type: "group",
    wrapItems: true,
    conditions: [
      {
        key: "source",
        in: ["overlay"],
      },
    ],
    fields: [
      {
        key: `y`,
        label: l10n("FIELD_Y"),
        description: l10n("FIELD_PRINT_Y_DESC"),
        type: "number",
        min: 0,
        max: 17,
        width: "50%",
        defaultValue: 0,
      },

      {
        key: `height`,
        label: l10n("FIELD_HEIGHT"),
        description: l10n("FIELD_PRINT_HEIGHT_DESC"),
        type: "number",
        min: 2,
        max: 18,
        step: 2,
        width: "50%",
        defaultValue: 18,
      },
    ],
  },

  {
    key: "__collapseSuccess",
    label: l10n("FIELD_IF_PRINT_SUCCESSFUL"),
    type: "collapsable",
    defaultValue: false,
  },

  {
    key: "true",
    label: l10n("FIELD_SUCCESS"),
    description: l10n("FIELD_SUCCESS_DESC"),
    type: "events",
    conditions: [
      {
        key: "__collapseSuccess",
        ne: true,
      },
    ],
  },
  {
    key: "__collapseElse",
    label: l10n("FIELD_ELSE"),
    type: "collapsable",
    defaultValue: false,
    conditions: [
      {
        key: "__disableElse",
        ne: true,
      },
    ],
  },
  {
    key: "false",
    label: l10n("FIELD_ERROR"),
    description: l10n("FIELD_ERROR_DESC"),
    conditions: [
      {
        key: "__collapseElse",
        ne: true,
      },
      {
        key: "__disableElse",
        ne: true,
      },
    ],
    type: "events",
  },
];

const compile = (input, helpers) => {
  const { overlayCopyFromBackground, printOverlay } = helpers;
  if (input.source === "background") {
    overlayCopyFromBackground();
    printOverlay(0, 18, input.margin, input.true, input.false);
  } else {
    printOverlay(input.y, input.height, input.margin, input.true, input.false);
  }
};

module.exports = {
  id,
  description: l10n("EVENT_PRINT_DESC"),
  subGroups,
  fields,
  compile,
};
