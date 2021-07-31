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
  groups,
  fields,
  compile,
};
