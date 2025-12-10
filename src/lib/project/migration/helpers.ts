import {
  CompressedProjectResources,
  ScriptEvent,
} from "shared/lib/resources/types";
import {
  mapScenesScript,
  mapActorsScript,
  mapTriggersScript,
  mapCustomScriptsScript,
  walkActorScripts,
  walkTriggerScripts,
} from "shared/lib/scripts/walk";

export type ScriptEventMigrationFn = (scriptEvent: ScriptEvent) => ScriptEvent;
export type ProjectResourcesMigrationFn = (
  resources: CompressedProjectResources,
) => CompressedProjectResources;

export type ProjectResourcesMigration = {
  from: { version: string; release: string };
  to: { version: string; release: string };
  migrationFn: ProjectResourcesMigrationFn;
};

export const applyProjectResourcesMigration = (
  resources: CompressedProjectResources,
  migration: ProjectResourcesMigration,
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

const buildPrefabEventsLookup = (
  resources: CompressedProjectResources,
): Record<string, ScriptEvent> => {
  const prefabEventsLookup: Record<string, ScriptEvent> = {};
  resources.actorPrefabs.forEach((actorPrefab) => {
    walkActorScripts(actorPrefab, undefined, (e) => {
      prefabEventsLookup[e.id] = e;
    });
  });
  resources.triggerPrefabs.forEach((triggerPrefab) => {
    walkTriggerScripts(triggerPrefab, undefined, (e) => {
      prefabEventsLookup[e.id] = e;
    });
  });
  return prefabEventsLookup;
};

export const migrateEvents = (
  resources: CompressedProjectResources,
  migrateFn: ScriptEventMigrationFn,
): CompressedProjectResources => {
  const prefabEventsLookup = buildPrefabEventsLookup(resources);
  return {
    ...resources,
    scenes: mapScenesScript(
      resources.scenes,
      { includePrefabOverrides: true, prefabEventsLookup },
      migrateFn,
    ),
    actorPrefabs: mapActorsScript(resources.actorPrefabs, migrateFn),
    triggerPrefabs: mapTriggersScript(resources.triggerPrefabs, migrateFn),
    scripts: mapCustomScriptsScript(resources.scripts, migrateFn),
  };
};

export const createScriptEventsMigrator =
  (migrateFn: ScriptEventMigrationFn) =>
  (resources: CompressedProjectResources): CompressedProjectResources =>
    migrateEvents(resources, migrateFn);

export const pipeMigrationFns = (
  migrationFns: ProjectResourcesMigrationFn[],
): ProjectResourcesMigrationFn => {
  return (resources: CompressedProjectResources): CompressedProjectResources =>
    migrationFns.reduce(
      (currentResources, migrationFn) => migrationFn(currentResources),
      resources,
    );
};

export const pipeScriptEventMigrationFns = (
  scriptEventMigrationFns: ScriptEventMigrationFn[],
): ScriptEventMigrationFn => {
  return (scriptEvent: ScriptEvent): ScriptEvent =>
    scriptEventMigrationFns.reduce(
      (currentScriptEvent, migrationFn) => migrationFn(currentScriptEvent),
      scriptEvent,
    );
};

export const isProjectVersion = (
  version: string,
  release: string,
  resources: CompressedProjectResources,
): boolean => {
  return (
    resources.metadata._version === version &&
    resources.metadata._release === release
  );
};
