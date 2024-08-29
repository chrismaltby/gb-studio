const l10n = require("../helpers/l10n").default;

const id = "EVENT_THREAD_STOP";
const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_MISC"];
const subGroups = {
  EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_THREADS",
  EVENT_GROUP_MISC: "EVENT_GROUP_THREADS",
};

const fields = [
  {
    key: "variable",
    label: l10n("FIELD_THREAD_HANDLE_VARIABLE"),
    description: l10n("FIELD_READ_THREAD_HANDLE_VARIABLE_DESC"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
];

const compile = (input, helpers) => {
  const { threadTerminate } = helpers;
  threadTerminate(input.variable);
};

module.exports = {
  id,
  description: l10n("EVENT_THREAD_STOP_DESC"),
  subGroups,
  groups,
  fields,
  compile,
};
