const id = "EVENT_ENGINE_FIELD_UPDATE";

const fields = [
  {
    type: "text",
    key: "engineFieldKey",
  },
];

const compile = (input, helpers) => {
  const { engineFieldSetToValue, engineFieldSetToVariable } = helpers;
  if (!input.value) {
    return;
  }
  if (input.value.type === "variable") {
    engineFieldSetToVariable(input.engineFieldKey, null, input.value.value);
  } else if (input.value.type === "variablePair") {
    const [hiVariable = "0", loVariable = "0"] = input.value.value.split(":");
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
