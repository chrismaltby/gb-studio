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
    type: "engineFieldValue",
    defaultValue: {
      type: "number",
      value: 0,
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
  const { engineFieldSetToScriptValue, engineFieldSetToDefault } = helpers;
  if (!input.value) {
    engineFieldSetToDefault(input.engineFieldKey);
  } else {
    engineFieldSetToScriptValue(input.engineFieldKey, input.value);
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
