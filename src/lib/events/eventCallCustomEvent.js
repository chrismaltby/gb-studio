const walkEvents = require("../helpers/eventSystem").walkEvents;
const compileEntityEvents = require("../compiler/compileEntityEvents").default;

const id = "EVENT_CALL_CUSTOM_EVENT";

const fields = [
  {
    type: "events",
    key: "script",
    hide: true,
    defaultValue: []
  },
  {
    type: "text",
    hide: true,
    key: "customEventId"
  }
];

const compile = (input, helpers) => {
  const script = JSON.parse(JSON.stringify(input.script));
  walkEvents(script, e => {
    if (!e.args) return;

    if (e.args.actorId && e.args.actordId !== "player") {
      e.args.actorId = input[`$actor[${e.args.actorId}]$`] || "$self$";
    }
    if (e.args.otherActorId && e.args.otherActorId !== "player") {
      e.args.otherActorId = input[`$actor[${e.args.otherActorId}]$`];
    }
    if (e.args.variable) {
      e.args.variable = input[`$variable[${e.args.variable}]$`];
    }
    if (e.args.vectorX) {
      e.args.vectorX = input[`$variable[${e.args.vectorX}]$`];
    }
    if (e.args.vectorY) {
      e.args.vectorY = input[`$variable[${e.args.vectorY}]$`];
    }
  });
  compileEntityEvents(script, { ...helpers, branch: true });
};

module.exports = {
  id,
  fields,
  compile
};
