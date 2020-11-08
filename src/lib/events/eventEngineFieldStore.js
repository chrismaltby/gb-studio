const id = "EVENT_ENGINE_FIELD_STORE";

const fields = [
  {
    type: "engineField",
    key: "engineFieldKey",
    postUpdate: (newArgs, prevArgs) => {
      // Reset value if engine field changed
      if (newArgs.engineFieldKey !== prevArgs.engineFieldKey) {
        return {
          engineFieldKey: newArgs.engineFieldKey,
          value: undefined
        }
      }
    }
  },
];

const compile = (input, helpers) => {
  const { engineFieldStoreInVariable } = helpers;
  engineFieldStoreInVariable(input.engineFieldKey, input.value);
};

module.exports = {
  id,
  fields,
  compile
};
