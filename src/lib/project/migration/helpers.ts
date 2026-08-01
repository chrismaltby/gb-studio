import {
  CompressedProjectResources,
  ScriptEvent,
} from "shared/lib/resources/types";
import type { ScriptEventDefs } from "shared/lib/scripts/scriptDefHelpers";
import {
  mapScenesScript,
  mapActorsScript,
  mapTriggersScript,
  mapCustomScriptsScript,
  walkActorScripts,
  walkTriggerScripts,
} from "shared/lib/scripts/walk";

export type ProjectResourcesMigrationContext = {
  scriptEventDefs: ScriptEventDefs;
};
export type ScriptEventMigrationFn = (
  scriptEvent: ScriptEvent,
  context?: ProjectResourcesMigrationContext,
) => ScriptEvent;
export type ProjectResourcesMigrationFn = (
  resources: CompressedProjectResources,
  context: ProjectResourcesMigrationContext,
) => CompressedProjectResources;

export type ProjectResourcesMigration = {
  from: { version: string; release: string };
  to: { version: string; release: string };
  migrationFn: ProjectResourcesMigrationFn;
};

export const applyProjectResourcesMigration = (
  resources: CompressedProjectResources,
  migration: ProjectResourcesMigration,
  context: ProjectResourcesMigrationContext,
): CompressedProjectResources => {
  if (
    !isProjectVersion(migration.from.version, migration.from.release, resources)
  ) {
    return resources;
  }
  return {
    ...migration.migrationFn(resources, context),
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
  context?: ProjectResourcesMigrationContext,
): CompressedProjectResources => {
  const prefabEventsLookup = buildPrefabEventsLookup(resources);
  const migrateEvent = (scriptEvent: ScriptEvent) =>
    migrateFn(scriptEvent, context);
  return {
    ...resources,
    scenes: mapScenesScript(
      resources.scenes,
      { includePrefabOverrides: true, prefabEventsLookup },
      migrateEvent,
    ),
    actorPrefabs: mapActorsScript(resources.actorPrefabs, migrateEvent),
    triggerPrefabs: mapTriggersScript(resources.triggerPrefabs, migrateEvent),
    scripts: mapCustomScriptsScript(resources.scripts, migrateEvent),
  };
};

export const createScriptEventsMigrator =
  (migrateFn: ScriptEventMigrationFn) =>
  (
    resources: CompressedProjectResources,
    context: ProjectResourcesMigrationContext,
  ): CompressedProjectResources =>
    migrateEvents(resources, migrateFn, context);

export const pipeMigrationFns = (
  migrationFns: ProjectResourcesMigrationFn[],
): ProjectResourcesMigrationFn => {
  return (
    resources: CompressedProjectResources,
    context: ProjectResourcesMigrationContext,
  ): CompressedProjectResources =>
    migrationFns.reduce(
      (currentResources, migrationFn) => migrationFn(currentResources, context),
      resources,
    );
};

export const pipeScriptEventMigrationFns = (
  scriptEventMigrationFns: ScriptEventMigrationFn[],
): ScriptEventMigrationFn => {
  return (
    scriptEvent: ScriptEvent,
    context?: ProjectResourcesMigrationContext,
  ): ScriptEvent =>
    scriptEventMigrationFns.reduce(
      (currentScriptEvent, migrationFn) =>
        migrationFn(currentScriptEvent, context),
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
