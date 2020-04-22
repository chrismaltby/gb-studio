export const id = "EVENT_SET_VALUE";

export const fields = [
  {
    key: "variable",
    type: "variable",
    defaultValue: "LAST_VARIABLE"
  },
  {
    key: "value",
    type: "number",
    min: 0,
    max: 255,
    defaultValue: "0"
  }
];

export const compile = (input, helpers) => {
  if (input.value > 1)  {
    const { variableSetToValue } = helpers;
    variableSetToValue(input.variable, input.value);
  }else if (input.value == 1) {
    const { variableSetToTrue } = helpers;
    variableSetToTrue(input.variable);
  }else {
    const { variableSetToFalse } = helpers;
    variableSetToFalse(input.variable);
  }
};
