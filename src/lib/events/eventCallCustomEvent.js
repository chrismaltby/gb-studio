const id = "EVENT_CALL_CUSTOM_EVENT";
const groups = ["EVENT_GROUP_CONTROL_FLOW"];

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
  groups,
  fields,
  compile,
  allowedBeforeInitFade: true,
};
