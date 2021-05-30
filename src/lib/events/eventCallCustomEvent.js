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
  const { isVariableField, isPropertyField } = helpers;
  const script = JSON.parse(JSON.stringify(input.script));
  walkEvents(script, e => {
    if (!e.args) return;

    if (e.args.actorId && e.args.actorId !== "player") {
      e.args.actorId = input[`$actor[${e.args.actorId}]$`] || "$self$";
    }
    if (e.args.otherActorId && e.args.otherActorId !== "player") {
      e.args.otherActorId = input[`$actor[${e.args.otherActorId}]$`] || "$self$";
    }

    Object.keys(e.args).forEach((arg) => {
      const argValue = e.args[arg];
      if (isVariableField(e.command, arg, e.args)) {
        if (argValue !== null && argValue.type === "variable") {
          e.args[arg] = {
            ...argValue,
            value: input[`$variable[${argValue.value}]$`]
          }
        } else {
          e.args[arg] = input[`$variable[${argValue}]$`];
        }
      }

      if (isPropertyField(e.command, arg, argValue)) {
        const replacePropertyValueActor = (p) => {
          const actorValue = p.replace(/:.*/, "");
          if (actorValue === "player") {
            return p;
          }
          const newActorValue = input[`$actor[${actorValue}]$`];
          return p.replace(/.*:/, `${newActorValue}:`);
        }

        if (argValue !== null && argValue.type === "property") {
          e.args[arg] = {
            ...argValue,
            value: replacePropertyValueActor(argValue.value)
          }
        } else {
          e.args[arg] = replacePropertyValueActor(argValue);          
        }
      }
    });
  });

  compileEntityEvents(script, { ...helpers, branch: true });
};

module.exports = {
  id,
  fields,
  compile
};