const id = "EVENT_ENGINE_FIELD_UPDATE";

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
  const { engineFieldSetToValue, engineFieldSetToVariable } = helpers;
  if (!input.value) {
    engineFieldSetToValue(input.engineFieldKey);
  }
  else if (input.value.type === "variable") {
    engineFieldSetToVariable(input.engineFieldKey, null, input.value.value);
  } else if (input.value.type === "variablePair") {
    const [hiVariable = "0", loVariable = "0"] = (input.value.value||"").split(":");
    engineFieldSetToVariable(input.engineFieldKey, hiVariable, loVariable);
  } else {
    engineFieldSetToValue(input.engineFieldKey, input.value.value);
  }
};

module.exports = {
  id,
  fields,
  compile,
};
