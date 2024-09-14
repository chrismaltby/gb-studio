import { ScriptEvent } from "shared/lib/entities/entitiesTypes";
import { CompressedProjectResources } from "shared/lib/resources/types";
import {
  mapActorsScript,
  mapCustomScriptsScript,
  mapScenesScript,
  mapTriggersScript,
} from "shared/lib/scripts/walk";

export const LATEST_PROJECT_VERSION = "4.2.0";
export const LATEST_PROJECT_MINOR_VERSION = "1";

type ScriptEventMigrationFn = (scriptEvent: ScriptEvent) => ScriptEvent;
type ProjectResourcesMigrationFn = (
  resources: CompressedProjectResources
) => CompressedProjectResources;

type ProjectResourcesMigration = {
  from: { version: string; release: string };
  to: { version: string; release: string };
  migrationFn: ProjectResourcesMigrationFn;
};

const applyProjectResourcesMigration = (
  resources: CompressedProjectResources,
  migration: ProjectResourcesMigration
): CompressedProjectResources => {
  if (
    !isProjectVersion(migration.from.version, migration.from.release, resources)
  ) {
    return resources;
  }
  return {
    ...migration.migrationFn(resources),
    metadata: {
      ...resources.metadata,
      _version: migration.to.version,
      _release: migration.to.release,
    },
  };
};

const migrateEvents = (
  resources: CompressedProjectResources,
  migrateFn: ScriptEventMigrationFn
): CompressedProjectResources => {
  return {
    ...resources,
    scenes: mapScenesScript(resources.scenes, migrateFn),
    actorPrefabs: mapActorsScript(resources.actorPrefabs, migrateFn),
    triggerPrefabs: mapTriggersScript(resources.triggerPrefabs, migrateFn),
    scripts: mapCustomScriptsScript(resources.scripts, migrateFn),
  };
};

const isProjectVersion = (
  version: string,
  release: string,
  resources: CompressedProjectResources
): boolean => {
  return (
    resources.metadata._version === version &&
    resources.metadata._release === release
  );
};

const migrateFrom410r1To420r1Event: ScriptEventMigrationFn = (scriptEvent) => {
  if (scriptEvent.args && scriptEvent.command === "EVENT_SWITCH") {
    for (let i = 0; i < 16; i++) {
      const key = `value${i}`;
      const defaultValue = i + 1;
      const storedValue = scriptEvent.args[key];
      const value =
        typeof storedValue === "number" ? storedValue : defaultValue;
      // Convert to constvalue
      scriptEvent.args[key] = {
        type: "number",
        value,
      };
    }
  }
  return scriptEvent;
};

const migrations: ProjectResourcesMigration[] = [
  {
    from: { version: "4.1.0", release: "1" },
    to: { version: "4.2.0", release: "1" },
    migrationFn: (resources) => {
      return migrateEvents(resources, migrateFrom410r1To420r1Event);
    },
  },
];

export const migrateProjectResources = async (
  resources: CompressedProjectResources
): Promise<CompressedProjectResources> => {
  return migrations.reduce((migratedResources, migration) => {
    return applyProjectResourcesMigration(migratedResources, migration);
  }, resources);
};
