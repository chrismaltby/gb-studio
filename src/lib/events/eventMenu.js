import l10n from "../helpers/l10n";

export const id = "EVENT_MENU";

export const fields = [].concat(
  [
    {
      key: "variable",
      type: "variable",
      defaultValue: "LAST_VARIABLE"
    },
    {
      key: "items",
      label: l10n("FIELD_NUMBER_OF_OPTIONS"),
      type: "number",
      min: 2,
      max: 8,
      defaultValue: 2
    }
  ],
  Array(8)
    .fill()
    .reduce((arr, _, i) => {
      const value = i + 1;
      arr.push({
        key: `option${i + 1}`,
        label: l10n("FIELD_SET_TO_VALUE_IF", { value: i + 1 }),
        type: "text",
        maxLength: 6,
        defaultValue: "",
        placeholder: l10n("FIELD_ITEM", { value: i + 1 }),
        conditions: [
          {
            key: "items",
            gt: value
          }
        ]
      },{
        key: `option${i + 1}`,
        label: l10n("FIELD_SET_TO_VALUE_IF", { value: i + 1 }),
        type: "text",
        maxLength: 6,
        defaultValue: "",
        placeholder: l10n("FIELD_ITEM", { value: i + 1 }),
        conditions: [
          {
            key: "items",
            eq: value
          },
          {
            key: "cancelOnLastOption",
            ne: true
          }
        ]
      },{
        key: `option${i + 1}`,
        label: l10n("FIELD_SET_TO_VALUE_IF", { value: 0 }),
        type: "text",
        maxLength: 6,
        defaultValue: "",
        placeholder: l10n("FIELD_ITEM", { value: 0 }),
        conditions: [
          {
            key: "items",
            eq: value
          },
          {
            key: "cancelOnLastOption",
            eq: true
          }
        ]
      });
      return arr;
    }, []),
    {
      type: "checkbox",
      label: l10n("FIELD_LAST_OPTION_CANCELS"),
      key: "cancelOnLastOption",
    }, 
    {
      type: "checkbox",
      label: l10n("FIELD_CANCEL_IF_B"),
      key: "cancelOnB",
      defaultValue: true
    },
    {
      key: "layout",
      type: "select",
      label: l10n("FIELD_LAYOUT"),
      options: [
        ["dialogue", l10n("FIELD_LAYOUT_DIALOGUE")],
        ["menu", l10n("FIELD_LAYOUT_MENU")]
      ],
      defaultValue: "dialogue"
    }
);

export const compile = (input, helpers) => {
  const { textMenu } = helpers;
  textMenu(input.variable, [input.option1, input.option2, input.option3, input.option4, input.option5, input.option6, input.option7, input.option8].splice(0, input.items), input.layout, input.cancelOnLastOption, input.cancelOnB);
};
