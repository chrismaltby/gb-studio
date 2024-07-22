const l10n = require("../helpers/l10n").default;

const id = "EVENT_CALL_CUSTOM_EVENT";
const groups = ["EVENT_GROUP_CONTROL_FLOW"];

const autoLabel = (fetchArg, input) => {
  if (input.customEventId === undefined) {
    return l10n("EVENT_CALL_CUSTOM_EVENT");
  }
  return l10n("EVENT_CALL_CUSTOM_EVENT_LABEL", {
    script: fetchArg("customEventId"),
  });
};

const fields = [
  {
    type: "customEvent",
    label: l10n("CUSTOM_EVENT"),
    description: l10n("FIELD_SCRIPT_CALL_DESC"),
    key: "customEventId",
    postUpdateFn: (newArgs, prevArgs) => {
      // Reset args if custom event changed
      if (newArgs.customEventId !== prevArgs.customEventId) {
        return {
          customEventId: newArgs.customEventId,
        };
      } else {
        return newArgs;
      }
    },
  },
  {
    type: "break",
  },
];

const compile = (input, helpers) => {
  const { callScript } = helpers;
  callScript(input.customEventId, input);
};

module.exports = {
  id,
  description: l10n("EVENT_CALL_CUSTOM_EVENT_DESC"),
  references: ["/docs/scripting/custom-scripts"],
  autoLabel,
  groups,
  fields,
  compile,
};
