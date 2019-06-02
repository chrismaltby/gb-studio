export const id = "EVENT_LOOP";

export const fields = [
  {
    key: "true",
    type: "events"
  }
];

export const compile = (input, helpers) => {
  const {
    labelDefine,
    labelGoto,
    nextFrameAwait,
    compileEvents,
    event
  } = helpers;
  const loopId = `loop_start_${event.id}`;
  labelDefine(loopId);
  compileEvents(input.true);
  nextFrameAwait();
  labelGoto(loopId);
};
