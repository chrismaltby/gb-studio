const l10n = require("../helpers/l10n").default;

const id = "EVENT_ENGINE_FIELD_SET";
const groups = ["EVENT_GROUP_ENGINE_FIELDS"];

const autoLabel = (fetchArg, input) => {
  if (input.engineFieldKey === undefined || input.value === undefined) {
    return l10n("EVENT_ENGINE_FIELD_SET");
  }
  return l10n("EVENT_ENGINE_FIELD_SET_LABEL", {
    engineField: fetchArg("engineFieldKey"),
    value: fetchArg("value"),
  });
};

const fields = [
  {
    type: "engineField",
    label: l10n("FIELD_ENGINE_FIELD"),
    description: l10n("FIELD_ENGINE_FIELD_SET_DESC"),
    key: "engineFieldKey",
    postUpdateFn: (newArgs, prevArgs) => {
      // Reset value if engine field changed
      if (newArgs.engineFieldKey !== prevArgs.engineFieldKey) {
        return {
          engineFieldKey: newArgs.engineFieldKey,
          value: undefined,
        };
      }
    },
  },
  {
    key: "value",
    type: "union",
    types: ["engineFieldValue", "variable"],
    defaultType: "engineFieldValue",
    defaultValue: {
      engineFieldValue: "ENGINE_FIELD_DEFAULT_VALUE",
      variable: "LAST_VARIABLE",
    },
    conditions: [
      {
        key: "engineFieldKey",
        set: true,
      },
    ],
  },
];

const compile = (input, helpers) => {
  const { engineFieldSetToValue, engineFieldSetToVariable } = helpers;
  if (!input.value) {
    engineFieldSetToValue(input.engineFieldKey);
  } else if (input.value.type === "variable") {
    engineFieldSetToVariable(input.engineFieldKey, input.value.value);
  } else {
    engineFieldSetToValue(input.engineFieldKey, input.value.value);
  }
};

module.exports = {
  id,
  description: l10n("EVENT_ENGINE_FIELD_SET_DESC"),
  references: ["/docs/settings/#engine-settings"],
  autoLabel,
  groups,
  fields,
  compile,
};
