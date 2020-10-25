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

  if (!input.value) {
    engineFieldStoreInVariable(input.engineFieldKey, "0", "0");
  }
  else if (input.value.indexOf(":") > -1) {
    const [hiVariable = "0", loVariable = "0"] = (input.value||"").split(":");
    engineFieldStoreInVariable(input.engineFieldKey, hiVariable, loVariable);
  }
  else {
    engineFieldStoreInVariable(input.engineFieldKey, null, input.value);
  }
};

module.exports = {
  id,
  fields,
  compile
};
