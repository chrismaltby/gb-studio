const l10n = require("../helpers/l10n").default;

const id = "EVENT_THREAD_START";
const groups = ["EVENT_GROUP_CONTROL_FLOW", "EVENT_GROUP_MISC"];
const subGroups = {
  EVENT_GROUP_CONTROL_FLOW: "EVENT_GROUP_THREADS",
  EVENT_GROUP_MISC: "EVENT_GROUP_THREADS",
};

const fields = [
  {
    key: "variable",
    label: l10n("FIELD_THREAD_HANDLE_VARIABLE"),
    description: l10n("FIELD_SET_THREAD_HANDLE_VARIABLE_DESC"),
    type: "variable",
    defaultValue: "LAST_VARIABLE",
  },
  {
    key: "__scriptTabs",
    type: "tabs",
    defaultValue: "true",
    values: {
      true: l10n("FIELD_RUN_IN_BACKGROUND"),
    },
  },
  {
    key: "true",
    description: l10n("FIELD_ON_CALL_DESC"),
    type: "events",
    allowedContexts: ["global", "entity"],
  },
];

const compile = (input, helpers) => {
  const { threadStart } = helpers;
  threadStart(input.variable, input.true);
};

module.exports = {
  id,
  description: l10n("EVENT_THREAD_START_DESC"),
  groups,
  subGroups,
  fields,
  compile,
};
