const l10n = require("../helpers/l10n").default;

const id = "EVENT_CALL_CUSTOM_EVENT";
const groups = ["EVENT_GROUP_CONTROL_FLOW"];

const autoLabel = (fetchArg) => {
  return l10n("EVENT_CALL_CUSTOM_EVENT_LABEL", {
    script: fetchArg("customEventId"),
  });
};

const fields = [
  {
    type: "customEvent",
    key: "customEventId",
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
  autoLabel,
  groups,
  fields,
  compile,
};
