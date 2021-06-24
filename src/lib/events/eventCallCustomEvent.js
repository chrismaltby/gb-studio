const id = "EVENT_CALL_CUSTOM_EVENT";
const groups = ["EVENT_GROUP_CONTROL_FLOW"];

const fields = [
  {
    type: "events",
    key: "script",
    hide: true,
    defaultValue: [],
  },
  {
    type: "text",
    hide: true,
    key: "customEventId",
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
