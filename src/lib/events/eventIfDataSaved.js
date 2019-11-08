import l10n from "../helpers/l10n";

export const id = "EVENT_IF_SAVED_DATA";

export const fields = [
  {
    label: l10n("FIELD_IF_SAVED_DATA")
  },
  {
    key: "true",
    type: "events"
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
];

export const compile = (input, helpers) => {
  const { ifDataSaved } = helpers;
  ifDataSaved(input.true, input.false);
};
