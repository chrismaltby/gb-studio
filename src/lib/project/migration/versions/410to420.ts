import {
  ScriptEventMigrationFn,
  ProjectResourcesMigration,
  createScriptEventsMigrator,
} from "lib/project/migration/helpers";

export const migrateFrom410r1To420r1Event: ScriptEventMigrationFn = (
  scriptEvent
) => {
  if (scriptEvent.args && scriptEvent.command === "EVENT_SWITCH") {
    const args: Record<string, unknown> = { ...scriptEvent.args };
    for (let i = 0; i < 16; i++) {
      const key = `value${i}`;
      const defaultValue = i + 1;
      const storedValue = args[key];
      const value =
        typeof storedValue === "number" ? storedValue : defaultValue;
      // Convert to constvalue
      args[key] = {
        type: "number",
        value,
      };
    }
    return {
      ...scriptEvent,
      args,
    };
  }
  return scriptEvent;
};

export const migrate410r1To420r1: ProjectResourcesMigration = {
  from: { version: "4.1.0", release: "1" },
  to: { version: "4.2.0", release: "1" },
  migrationFn: createScriptEventsMigrator(migrateFrom410r1To420r1Event),
};

export const migrateFrom420r1To420r2Event: ScriptEventMigrationFn = (
  scriptEvent
) => {
  if (scriptEvent.args && scriptEvent.command === "EVENT_WAIT") {
    const args: Record<string, unknown> = { ...scriptEvent.args };
    // Convert to constvalue
    console.log(">>", args);
    if (args["frames"]) {
      args["frames"] = {
        type: "number",
        value: args["frames"],
      };
    }
    if (args["time"]) {
      args["time"] = {
        type: "number",
        value: args["time"],
      };
    }
    console.log("<<", args);
    return {
      ...scriptEvent,
      args,
    };
  }
  return scriptEvent;
};

export const migrate420r1To420r2: ProjectResourcesMigration = {
  from: { version: "4.2.0", release: "1" },
  to: { version: "4.2.0", release: "2" },
  migrationFn: createScriptEventsMigrator(migrateFrom420r1To420r2Event),
};
