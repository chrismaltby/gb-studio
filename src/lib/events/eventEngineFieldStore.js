const l10n = require("../helpers/l10n").default;

const id = "EVENT_ENGINE_FIELD_STORE";
const groups = ["EVENT_GROUP_ENGINE_FIELDS", "EVENT_GROUP_VARIABLES"];
const subGroups = {
  EVENT_GROUP_VARIABLES: "EVENT_GROUP_ENGINE_FIELDS",
};

const autoLabel = (fetchArg, input) => {
  if (input.engineFieldKey === undefined || input.value === undefined) {
    return l10n("EVENT_ENGINE_FIELD_STORE");
  }
  return l10n("EVENT_ENGINE_FIELD_STORE_LABEL", {
    variable: fetchArg("value"),
    engineField: fetchArg("engineFieldKey"),
  });
};

const fields = [
  {
    type: "engineField",
    label: l10n("FIELD_ENGINE_FIELD"),
    description: l10n("FIELD_ENGINE_FIELD_READ_DESC"),
    key: "engineFieldKey",
    defaultValue: "LAST_ENGINE_FIELD",
  },
  {
    key: "value",
    type: "variable",
    label: l10n("FIELD_VARIABLE"),
    description: l10n("FIELD_VARIABLE_DESC"),
    defaultValue: "LAST_VARIABLE",
    conditions: [
      {
        key: "engineFieldKey",
        set: true,
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { engineFieldStoreInVariable } = helpers;
  engineFieldStoreInVariable(input.engineFieldKey, input.value);
};

module.exports = {
  id,
  description: l10n("EVENT_ENGINE_FIELD_STORE_DESC"),
  references: ["/docs/settings/#engine-settings"],
  autoLabel,
  groups,
  subGroups,
  fields,
  compile,
};
