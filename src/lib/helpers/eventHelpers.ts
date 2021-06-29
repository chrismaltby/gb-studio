import { EventHandler } from "lib/events";

export const patchEventArgs = (
  command: string,
  type: string,
  args: Record<string, unknown>,
  replacements: Record<string, unknown>
) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const events = require("../events").default;
  const eventSchema: EventHandler = events[command];

  if (!eventSchema) {
    return args;
  }

  const patchArgs: Record<string, unknown> = {};
  eventSchema.fields.forEach((field) => {
    if (field.type === type) {
      if (replacements[args[field.key] as string]) {
        patchArgs[field.key] = replacements[args[field.key] as string];
      }
    }
  });

  return {
    ...args,
    ...patchArgs,
  };
};
