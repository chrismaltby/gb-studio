const id = "EVENT_LOOP";

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
  fields,
  compile,
};
