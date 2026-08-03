const l10n = require("../helpers/l10n").default;

const id = "EVENT_IF_INPUT";
const groups = ["EVENT_GROUP_INPUT", "EVENT_GROUP_CONTROL_FLOW"];
const subGroups = {
  EVENT_GROUP_INPUT: "EVENT_GROUP_CONTROL_FLOW",
  EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_INPUT",
};

const autoLabel = (fetchArg) => {
  const joypad = parseInt(fetchArg("joypad") ?? 0);
  if (!joypad) {
    return l10n("EVENT_IF_INPUT_LABEL", {
      input: fetchArg("input"),
    });
  } else {
    return l10n("EVENT_IF_INPUT_JOYPAD_LABEL", {
      input: fetchArg("input"),
      joypad: joypad + 1,
    });
  }
};

const fields = [
  {
    type: "group",
    flexBasis: "100%",
    alignBottom: true,
    wrapItems: true,
    fields: [
      {
        key: "joypad",
        label: l10n("FIELD_JOYPAD"),
        description: l10n("FIELD_JOYPAD_DESC"),
        type: "joypads",
        defaultValue: 0,
        conditions: [
          {
            sgbEnabled: true,
          },
        ],
        alignBottom: true,
        flexBasis: 25,
      },
      {
        key: "input",
        label: l10n("FIELD_ANY_OF"),
        description: l10n("FIELD_INPUT_MULTIPLE_DESC"),
        type: "input",
        defaultValue: ["a", "b"],
        flexBasis: 75,
      },
    ],
  },
  {
    key: "true",
    label: l10n("FIELD_TRUE"),
    description: l10n("FIELD_TRUE_DESC"),
    type: "events",
  },
  {
    key: "__collapseElse",
    label: l10n("FIELD_ELSE"),
    type: "collapsable",
    defaultValue: true,
    conditions: [
      {
        key: "__disableElse",
        ne: true,
      },
    ],
  },
  {
    key: "false",
    label: l10n("FIELD_FALSE"),
    description: l10n("FIELD_FALSE_DESC"),
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
  const { ifInput } = helpers;
  const truePath = input.true;
  const falsePath = input.__disableElse ? [] : input.false;
  ifInput(input.input, truePath, falsePath, input.joypad ?? 0);
};

module.exports = {
  id,
  description: l10n("EVENT_IF_INPUT_DESC"),
  references: ["/docs/scripting/script-glossary/input#attach-script-to-button"],
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
};
