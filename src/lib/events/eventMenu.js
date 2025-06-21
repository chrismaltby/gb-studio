const l10n = require("../helpers/l10n").default;

const id = "EVENT_MENU";
const groups = ["EVENT_GROUP_DIALOGUE"];

const autoLabel = (fetchArg) => {
  const numItems = parseInt(fetchArg("items"));
  const text = Array(numItems)
    .fill()
    .map((_, i) => {
      return `"${fetchArg(`option${i + 1}`)}"`;
    })
    .join();
  return l10n("EVENT_MENU_LABEL", {
    variable: fetchArg("variable"),
    text,
  });
};

const fields = [].concat(
  [
    {
      key: "variable",
      label: l10n("FIELD_SET_VARIABLE"),
      description: l10n("FIELD_VARIABLE_DESC"),
      type: "variable",
      defaultValue: "LAST_VARIABLE",
    },
    {
      key: "items",
      label: l10n("FIELD_NUMBER_OF_OPTIONS"),
      description: l10n("FIELD_NUMBER_OF_OPTIONS_DESC"),
      type: "number",
      min: 2,
      max: 8,
      defaultValue: 2,
    },
    {
      type: "break",
    },
  ],
  Array(8)
    .fill()
    .reduce((arr, _, i) => {
      const value = i + 1;
      arr.push(
        {
          key: `option${i + 1}`,
          label: l10n("FIELD_SET_TO_VALUE_IF", { value: String(i + 1) }),
          description: l10n("FIELD_SET_TO_VALUE_IF_MENU_DESC", {
            value: String(i + 1),
          }),
          hideFromDocs: i >= 2,
          type: "textarea",
          singleLine: true,
          defaultValue: "",
          placeholder: l10n("FIELD_ITEM", { value: String(i + 1) }),
          conditions: [
            {
              key: "items",
              gt: value,
            },
          ],
        },
        {
          key: `option${i + 1}`,
          label: l10n("FIELD_SET_TO_VALUE_IF", { value: String(i + 1) }),
          description: l10n("FIELD_SET_TO_VALUE_IF_MENU_DESC", {
            value: String(i + 1),
          }),
          hideFromDocs: i >= 2,
          type: "textarea",
          singleLine: true,
          defaultValue: "",
          placeholder: l10n("FIELD_ITEM", { value: String(i + 1) }),
          conditions: [
            {
              key: "items",
              eq: value,
            },
            {
              key: "cancelOnLastOption",
              ne: true,
            },
          ],
        },
        {
          key: `option${i + 1}`,
          label: l10n("FIELD_SET_TO_VALUE_IF", { value: "0" }),
          description: l10n("FIELD_SET_TO_VALUE_IF_MENU_DESC", { value: "0" }),
          hideFromDocs: true,
          type: "textarea",
          singleLine: true,
          defaultValue: "",
          placeholder: l10n("FIELD_ITEM", { value: String(i + 1) }),
          conditions: [
            {
              key: "items",
              eq: value,
            },
            {
              key: "cancelOnLastOption",
              eq: true,
            },
          ],
        },
      );
      return arr;
    }, []),
  {
    type: "break",
  },
  {
    type: "checkbox",
    label: l10n("FIELD_LAST_OPTION_CANCELS"),
    description: l10n("FIELD_LAST_OPTION_CANCELS_DESC"),
    key: "cancelOnLastOption",
  },
  {
    type: "checkbox",
    label: l10n("FIELD_CANCEL_IF_B"),
    description: l10n("FIELD_CANCEL_IF_B_DESC"),
    key: "cancelOnB",
    defaultValue: true,
  },
  {
    key: "layout",
    type: "select",
    label: l10n("FIELD_LAYOUT"),
    description: l10n("FIELD_LAYOUT_MENU_DESC"),
    options: [
      ["dialogue", l10n("FIELD_LAYOUT_DIALOGUE")],
      ["menu", l10n("FIELD_LAYOUT_MENU")],
    ],
    defaultValue: "dialogue",
  },
);

const compile = (input, helpers) => {
  const { textMenu } = helpers;
  textMenu(
    input.variable,
    [
      input.option1,
      input.option2,
      input.option3,
      input.option4,
      input.option5,
      input.option6,
      input.option7,
      input.option8,
    ].splice(0, input.items),
    input.layout,
    input.cancelOnLastOption,
    input.cancelOnB,
  );
};

module.exports = {
  id,
  description: l10n("EVENT_MENU_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
  waitUntilAfterInitFade: true,
};
