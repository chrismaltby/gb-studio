const l10n = require("../helpers/l10n").default;

const id = "EVENT_ENGINE_FIELD_STORE";
const groups = ["EVENT_GROUP_ENGINE_FIELDS", "EVENT_GROUP_VARIABLES"];

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
  const { engineFieldStoreInVariable } = helpers;
  engineFieldStoreInVariable(input.engineFieldKey, input.value);
};

module.exports = {
  id,
  autoLabel,
  groups,
  fields,
  compile,
};
