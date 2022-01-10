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
    key: "engineFieldKey",
    postUpdate: (newArgs, prevArgs) => {
      // Reset value if engine field changed
      if (newArgs.engineFieldKey !== prevArgs.engineFieldKey) {
        return {
          engineFieldKey: newArgs.engineFieldKey,
          value: undefined,
        };
      }
    },
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
  autoLabel,
  groups,
  fields,
  compile,
};
