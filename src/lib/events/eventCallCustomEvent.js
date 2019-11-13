import { walkEvents } from "../helpers/eventSystem";
import compileEntityEvents from "../compiler/compileEntityEvents";

export const id = "EVENT_CALL_CUSTOM_EVENT";

export const fields = [
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

export const compile = (input, helpers) => {
  const script = JSON.parse(JSON.stringify(input.script));
  walkEvents(script, e => {
    if (!e.args) return;

    if (e.args.actorId && e.args.actordId !== "player") {
      e.args.actorId = input[`$actor[${e.args.actorId}]$`];
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
