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
    } else if (
      type === "actor" &&
      (args[field.key] as { type?: string })?.type === "property"
    ) {
      const propertyParts = (
        (args[field.key] as { value?: string })?.value || ""
      ).split(":");
      if (propertyParts.length === 2) {
        patchArgs[field.key] = {
          type: "property",
          value: `${replacements[propertyParts[0]]}:${propertyParts[1]}`,
        };
      }
    }
  });

  return {
    ...args,
    ...patchArgs,
  };
};
