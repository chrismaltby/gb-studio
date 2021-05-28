const id = "EVENT_CALL_CUSTOM_EVENT";

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
  fields,
  compile,
  allowedBeforeInitFade: true,
};
