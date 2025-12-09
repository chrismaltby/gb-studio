import { OVERLAY_SPEED_INSTANT, TILE_SIZE } from "consts";
import { eventHasArg } from "lib/helpers/eventSystem";
import {
  ScriptEventMigrationFn,
  ProjectResourcesMigration,
  createScriptEventsMigrator,
  ProjectResourcesMigrationFn,
  pipeMigrationFns,
} from "lib/project/migration/helpers";
import { keyBy } from "lodash";
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
  if (!scriptEvent.args) return scriptEvent;

  const args = { ...scriptEvent.args };

  const migrateSpeedInstant = (key: string) => {
    if (eventHasArg(scriptEvent, key)) {
      const speed = ensureNumber(parseInt(String(args[key]), 10), 0);
      if (speed === 0) {
        args[key] = OVERLAY_SPEED_INSTANT;
      } else {
        args[key] = speed;
      }
    }
  };

  const migrateSpeedInstantAndOffset = (key: string) => {
    if (eventHasArg(scriptEvent, key)) {
      const speed = ensureNumber(parseInt(String(args[key]), 10), 0);
      if (speed === 0) {
        args[key] = OVERLAY_SPEED_INSTANT;
      } else if (speed > 0) {
        args[key] = speed - 1;
      }
    }
  };

  switch (scriptEvent.command) {
    case "EVENT_DIALOGUE_CLOSE_NONMODAL":
    case "EVENT_OVERLAY_MOVE_TO": {
      migrateSpeedInstant("speed");
      break;
    }
    case "EVENT_TEXT":
    case "EVENT_TEXT_SET_ANIMATION_SPEED": {
      migrateSpeedInstantAndOffset("speedIn");
      migrateSpeedInstantAndOffset("speedOut");
      break;
    }
    default: {
      return scriptEvent;
    }
  }

  return { ...scriptEvent, args };
};

export const migrate420r4To420r5: ProjectResourcesMigration = {
  from: { version: "4.2.0", release: "4" },
  to: { version: "4.2.0", release: "5" },
  migrationFn: createScriptEventsMigrator(migrateFrom420r4To420r5Event),
};

export const migrateFrom420r5To420r6EngineFields: ProjectResourcesMigrationFn =
  (resources) => {
    const engineFieldValues = resources.engineFieldValues.engineFieldValues;

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

    setDefaultFieldValue(
      "SHOOTER_MOVEMENT_TYPE",
      "MOVEMENT_TYPE_LOCK_PERPENDICULAR",
    );
    setDefaultFieldValue("SHOOTER_TRIGGER_ACTIVATION", "ON_PLAYER_COLLISION");
    setDefaultFieldValue(
      "SHOOTER_WALL_COLLISION_GROUP",
      "COLLISION_GROUP_NONE",
    );

    return {
      ...resources,
      engineFieldValues: {
        ...resources.engineFieldValues,
        engineFieldValues,
      },
    };
  };

export const migrate420r5To420r6: ProjectResourcesMigration = {
  from: { version: "4.2.0", release: "5" },
  to: { version: "4.2.0", release: "6" },
  migrationFn: migrateFrom420r5To420r6EngineFields,
};

export const migrateFrom420r6To420r7Event: ScriptEventMigrationFn = (
  scriptEvent,
) => {
  if (
    scriptEvent.args &&
    scriptEvent.command === "EVENT_ACTOR_SET_COLLISION_BOX"
  ) {
    const args: Record<string, unknown> = { ...scriptEvent.args };
    // Convert to constvalue
    args["x"] = {
      type: "number",
      value: ensureNumber(parseInt(String(args["x"]), 10), 0),
    };
    args["y"] = {
      type: "number",
      value: ensureNumber(parseInt(String(args["y"]), 10), -8),
    };
    args["width"] = {
      type: "number",
      value: ensureNumber(parseInt(String(args["width"]), 10), 16),
    };
    args["height"] = {
      type: "number",
      value: ensureNumber(parseInt(String(args["height"]), 10), 16),
    };
    return {
      ...scriptEvent,
      args,
    };
  }
  return scriptEvent;
};

export const migrate420r6To420r7: ProjectResourcesMigration = {
  from: { version: "4.2.0", release: "6" },
  to: { version: "4.2.0", release: "7" },
  migrationFn: createScriptEventsMigrator(migrateFrom420r6To420r7Event),
};

export const migrateFrom420r7To420r8Scenes: ProjectResourcesMigrationFn = (
  resources,
) => {
  const backgroundsLookup = keyBy(resources.backgrounds, "id");

  const scenes = resources.scenes.map((scene) => {
    const background = backgroundsLookup[scene.backgroundId];
    if (background && background.autoColor) {
      return {
        ...scene,
        paletteIds: scene.paletteIds.map((paletteId, index) => {
          if (index === 7) {
            return "auto";
          }
          return paletteId;
        }),
      };
    }
    return scene;
  });

  return {
    ...resources,
    scenes,
  };
};

export const migrate420r7To420r8: ProjectResourcesMigration = {
  from: { version: "4.2.0", release: "7" },
  to: { version: "4.2.0", release: "8" },
  migrationFn: migrateFrom420r7To420r8Scenes,
};

export const migrateFrom420r8To420r9Settings: ProjectResourcesMigrationFn = (
  resources,
) => {
  return {
    ...resources,
    settings: {
      ...resources.settings,
      autoTileFlipEnabled: false,
    },
  };
};

export const migrate420r8To420r9: ProjectResourcesMigration = {
  from: { version: "4.2.0", release: "8" },
  to: { version: "4.2.0", release: "9" },
  migrationFn: migrateFrom420r8To420r9Settings,
};
