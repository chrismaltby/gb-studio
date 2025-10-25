import { TILE_SIZE } from "consts";
import { eventHasArg } from "lib/helpers/eventSystem";
import {
  ScriptEventMigrationFn,
  ProjectResourcesMigration,
  createScriptEventsMigrator,
  ProjectResourcesMigrationFn,
  pipeMigrationFns,
} from "lib/project/migration/helpers";
import { ensureNumber } from "shared/types";

export const migrateFrom410r1To420r1Event: ScriptEventMigrationFn = (
  scriptEvent,
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
  scriptEvent,
) => {
  if (scriptEvent.args && scriptEvent.command === "EVENT_WAIT") {
    const args: Record<string, unknown> = { ...scriptEvent.args };
    // Convert to constvalue
    args["frames"] = {
      type: "number",
      value: typeof args["frames"] === "number" ? args["frames"] : 30,
    };
    args["time"] = {
      type: "number",
      value: typeof args["time"] === "number" ? args["time"] : 0.5,
    };

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

export const migrateFrom420r2To420r3Event: ScriptEventMigrationFn = (
  scriptEvent,
) => {
  if (
    scriptEvent.args &&
    (scriptEvent.command === "EVENT_ACTOR_MOVE_TO" ||
      scriptEvent.command === "EVENT_ACTOR_MOVE_RELATIVE")
  ) {
    const args: Record<string, unknown> = { ...scriptEvent.args };
    // If useCollisions was set default to all collisions
    args["collideWith"] = args["useCollisions"] ? ["walls", "actors"] : [];
    return {
      ...scriptEvent,
      args,
    };
  }
  return scriptEvent;
};

export const migrateFrom420r2To420r3EngineFields: ProjectResourcesMigrationFn =
  (resources) => {
    const engineFieldValues = resources.engineFieldValues.engineFieldValues.map(
      (fieldValue) => {
        if (fieldValue.id === "shooter_scroll_speed") {
          return {
            ...fieldValue,
            value:
              typeof fieldValue.value === "number" ? fieldValue.value * 2 : 0,
          };
        }
        return fieldValue;
      },
    );

    const hasFieldValue = (id: string) => {
      return engineFieldValues.some((fieldValue) => fieldValue.id === id);
    };

    const setDefaultFieldValue = (
      id: string,
      value: string | number | undefined,
    ) => {
      if (!hasFieldValue(id)) {
        engineFieldValues.push({
          id: id,
          value,
        });
      }
    };

    setDefaultFieldValue("FEAT_PLATFORM_COYOTE_TIME", 0);
    setDefaultFieldValue("FEAT_PLATFORM_DROP_THROUGH", 0);

    return {
      ...resources,
      engineFieldValues: {
        ...resources.engineFieldValues,
        engineFieldValues,
      },
    };
  };

export const migrate420r2To420r3: ProjectResourcesMigration = {
  from: { version: "4.2.0", release: "2" },
  to: { version: "4.2.0", release: "3" },
  migrationFn: pipeMigrationFns([
    createScriptEventsMigrator(migrateFrom420r2To420r3Event),
    migrateFrom420r2To420r3EngineFields,
  ]),
};

export const migrateFrom420r3To420r4Sprites: ProjectResourcesMigrationFn = (
  resources,
) => {
  return {
    ...resources,
    sprites: resources.sprites.map((sprite) => {
      const currentBoundsY = sprite.boundsY || 0;
      const currentBoundsHeight = sprite.boundsHeight || 16;
      return {
        ...sprite,
        boundsY: TILE_SIZE - currentBoundsY - currentBoundsHeight,
      };
    }),
  };
};

export const migrateFrom420r3To420r4Event: ScriptEventMigrationFn = (
  scriptEvent,
) => {
  if (
    scriptEvent.args &&
    scriptEvent.command === "EVENT_ACTOR_SET_COLLISION_BOX"
  ) {
    const args: Record<string, unknown> = { ...scriptEvent.args };
    const currentBoundsY = ensureNumber(args["y"], 0);
    const currentBoundsHeight = ensureNumber(args["height"], 16);
    args["y"] = TILE_SIZE - currentBoundsY - currentBoundsHeight;
    return {
      ...scriptEvent,
      args,
    };
  }
  return scriptEvent;
};

export const migrate420r3To420r4: ProjectResourcesMigration = {
  from: { version: "4.2.0", release: "3" },
  to: { version: "4.2.0", release: "4" },
  migrationFn: pipeMigrationFns([
    migrateFrom420r3To420r4Sprites,
    createScriptEventsMigrator(migrateFrom420r3To420r4Event),
  ]),
};

export const migrateFrom420r4To420r5Event: ScriptEventMigrationFn = (
  scriptEvent,
) => {
  if (
    scriptEvent.args &&
    (scriptEvent.command === "EVENT_DIALOGUE_CLOSE_NONMODAL" ||
      scriptEvent.command === "EVENT_OVERLAY_MOVE_TO")
  ) {
    const args: Record<string, unknown> = { ...scriptEvent.args };
    if (eventHasArg(scriptEvent, "speed")) {
      const currentSpeed = ensureNumber(args["speed"], 0);
      if (currentSpeed > 0) {
        args["speed"] = currentSpeed + 1;
      }
    }
    return {
      ...scriptEvent,
      args,
    };
  }
  return scriptEvent;
};

export const migrate420r4To420r4: ProjectResourcesMigration = {
  from: { version: "4.2.0", release: "4" },
  to: { version: "4.2.0", release: "5" },
  migrationFn: createScriptEventsMigrator(migrateFrom420r4To420r5Event),
};
