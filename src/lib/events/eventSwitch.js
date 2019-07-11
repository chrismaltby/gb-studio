import l10n from "../helpers/l10n";

export const id = "EVENT_SWITCH";

export const fields = [].concat(
  [
    {
      key: "variable",
      type: "variable",
      defaultValue: "LAST_VARIABLE"
    },
    {
      key: "choices",
      label: "Number of cases",
      type: "number",
      min: 1,
      max: 16,
      defaultValue: 1
    }
  ],
  Array(16)
    .fill()
    .reduce((arr, _, i) => {
      arr.push({
        key: `__collapseCase${i}`,
        label: `${l10n("FIELD_CASE")}: $$value${i}$$`,
        conditions: [
          {
            key: "choices",
            gt: i
          }
        ],
        type: "collapsable",
        defaultValue: false
      });
      arr.push({
        key: `value${i}`,
        label: l10n("FIELD_VALUE"),
        conditions: [
          {
            key: `__collapseCase${i}`,
            ne: true
          },
          {
            key: "choices",
            gt: i
          }
        ],
        type: "number",
        min: 0,
        max: 255,
        defaultValue: i
      });
      arr.push({
        key: `true${i}`,
        conditions: [
          {
            key: `__collapseCase${i}`,
            ne: true
          },
          {
            key: "choices",
            gt: i
          }
        ],
        type: "events"
      });
      return arr;
    }, []),
  [
    {
      key: "__collapseElse",
      label: l10n("FIELD_DEFAULT"),
      type: "collapsable",
      defaultValue: false
    },
    {
      key: "false",
      conditions: [
        {
          key: "__collapseElse",
          ne: true
        }
      ],
      type: "events"
    }
  ]
);

export const compile = (input, helpers) => {
  const { textChoice } = helpers;
  const { variable, trueText, falseText } = input;
  textChoice(variable, { trueText, falseText });
};
