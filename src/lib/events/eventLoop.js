const l10n = require("../helpers/l10n").default;

const id = "EVENT_LOOP";
const groups = ["EVENT_GROUP_CONTROL_FLOW"];

const fields = [
  {
    key: "true",
    type: "events",
  },
];

const compile = (input, helpers) => {
  const { labelDefine, labelGoto, getNextLabel, compileEvents } = helpers;
  const loopId = getNextLabel();
  labelDefine(loopId);
  compileEvents(input.true);
  labelGoto(loopId);
};

module.exports = {
  id,
  description: l10n("EVENT_LOOP_DESC"),
  groups,
  fields,
  compile,
};
