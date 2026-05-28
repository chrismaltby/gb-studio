const l10n = require("../helpers/l10n").default;

const id = "EVENT_DATA_TABLE";
const groups = ["EVENT_GROUP_VARIABLES"];
const subGroups = {
  EVENT_GROUP_VARIABLES: "EVENT_GROUP_DATA_TABLE",
};
const fields = [
  {
    key: "indexVariable",
    type: "variable",
    label: l10n("FIELD_INDEX_VARIABLE"),
    description: l10n("FIELD_INDEX_VARIABLE_DESC"),
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "data",
    label: l10n("FIELD_DATA"),
    description: l10n("FIELD_DATA_TABLE_DESC"),
    type: "dataTable",
    flexBasis: "100%",
    defaultValue: [
      {
        variable: "0",
        values: [
          {
            type: "number",
            value: 0,
          },
        ],
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { variableDataTableLookup } = helpers;
  variableDataTableLookup(input.indexVariable, input.data);
};

module.exports = {
  id,
  description: l10n("EVENT_DATA_TABLE_DESC"),
  groups,
  subGroups,
  fields,
  compile,
};
