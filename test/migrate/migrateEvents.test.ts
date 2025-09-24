import { migrateEvents } from "lib/project/migration/helpers";
import {
  migrateActorsTestProject,
  migrateActorPrefabsTestProject,
  migrateActorPrefabsTestProject2,
  migrateTriggerPrefabsTestProject,
  migrateTriggerPrefabsTestProject2,
} from "./data/migrationTestProject";
import { ScriptEvent } from "shared/lib/entities/entitiesTypes";

const testEventMigration = (e: ScriptEvent) => {
  if (e.command !== "EVENT_TEST") {
    return e;
  }
  return {
    ...e,
    args: {
      value: e.args?.value === "FIND" ? "REPLACE" : "VOID",
    },
  };
};

describe("migrateEvents", () => {
  test("should migrate actors scripts", async () => {
    const project = migrateActorsTestProject;
    const migrated = await migrateEvents(project, testEventMigration);
    expect(migrated.scenes[0].actors[0].script[0].args?.value).toEqual(
      "REPLACE",
    );
  });

  test("should migrate actor prefabs and prefab overrides", async () => {
    const project = migrateActorPrefabsTestProject;
    const migrated = await migrateEvents(project, testEventMigration);
    expect(migrated.actorPrefabs[0].script[0].args?.value).toEqual("REPLACE");
    expect(
      migrated.scenes[0].actors[0].prefabScriptOverrides[
        migrated.actorPrefabs[0].script[0].id
      ].args?.value,
    ).toEqual("REPLACE");
  });

  test("should migrate not migrate actor prefab overrides fields that weren't overriden already", async () => {
    const project = migrateActorPrefabsTestProject2;
    const migrated = await migrateEvents(project, testEventMigration);
    expect(migrated.actorPrefabs[0].script[0].args?.value).toEqual("VOID");
    expect(
      migrated.scenes[0].actors[0].prefabScriptOverrides[
        migrated.actorPrefabs[0].script[0].id
      ].args?.value,
    ).toBeUndefined();
    expect(
      migrated.scenes[0].actors[0].prefabScriptOverrides[
        migrated.actorPrefabs[0].script[0].id
      ].args?.value3,
    ).toEqual("BAR");
    expect(
      migrated.scenes[0].actors[0].prefabScriptOverrides["event2"].args?.value,
    ).toEqual("FIND");
  });

  test("should migrate trigger prefabs and prefab overrides", async () => {
    const project = migrateTriggerPrefabsTestProject;
    const migrated = await migrateEvents(project, testEventMigration);
    expect(migrated.triggerPrefabs[0].script[0].args?.value).toEqual("REPLACE");
    expect(
      migrated.scenes[0].triggers[0].prefabScriptOverrides[
        migrated.triggerPrefabs[0].script[0].id
      ].args?.value,
    ).toEqual("REPLACE");
  });

  test("should migrate not migrate trigger prefab overrides fields that weren't overriden already", async () => {
    const project = migrateTriggerPrefabsTestProject2;
    const migrated = await migrateEvents(project, testEventMigration);
    expect(migrated.triggerPrefabs[0].script[0].args?.value).toEqual("VOID");
    expect(
      migrated.scenes[0].triggers[0].prefabScriptOverrides[
        migrated.triggerPrefabs[0].script[0].id
      ].args?.value,
    ).toBeUndefined();
    expect(
      migrated.scenes[0].triggers[0].prefabScriptOverrides["event2"].args
        ?.value,
    ).toEqual("FIND");
  });
});
