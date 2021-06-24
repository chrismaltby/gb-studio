const id = "EVENT_ENGINE_FIELD_SET";
const groups = ["EVENT_GROUP_ENGINE_FIELDS"];

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
  groups,
  fields,
  compile,
  allowedBeforeInitFade: true,
};
