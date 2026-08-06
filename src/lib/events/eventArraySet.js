const l10n = require("../helpers/l10n").default;

const id = "EVENT_ARRAY_SET";
const groups = ["EVENT_GROUP_VARIABLES"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_ARRAY_SET_LABEL", {
    array: fetchArg("array"),
  });
};

const fields = [
  {
    key: "array",
    description: l10n("FIELD_ARRAY_DESC"),
    type: "variable",
    variableType: "arrayReference",
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "arrayValues",
    description: l10n("FIELD_ARRAY_VALUES_SET_DESC"),
    type: "arraySet",
    defaultValue: [],
  },
];

const compile = (input, helpers) => {
  const { variableSetToScriptValue, _getArrayLength } = helpers;

  if (_getArrayLength(input.array) < input.arrayValues.length) {
    throw new Error(
      `Trying to initialize an array with ${input.arrayValues.length} elements, but the provided array has ${_getArrayLength(input.array)}`,
    );
  }

  input.arrayValues.forEach((value, i) => {
    variableSetToScriptValue(
      {
        ...input.array,
        index: { type: "number", value: i },
      },
      value,
    );
  });
};

module.exports = {
  id,
  description: l10n("EVENT_ARRAY_SET_DESC"),
  autoLabel,
  groups,
  fields,
  compile,
};
