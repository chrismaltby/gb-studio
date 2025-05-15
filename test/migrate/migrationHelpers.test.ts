import {
  applyProjectResourcesMigration,
  createScriptEventsMigrator,
  isProjectVersion,
  migrateEvents,
  pipeMigrationFns,
  pipeScriptEventMigrationFns,
  ProjectResourcesMigration,
} from "lib/project/migration/helpers";
import {
  dummyActorPrefabResource,
  dummyActorResource,
  dummyCompressedProjectResources,
  dummyCompressedSceneResource,
  dummyScriptResource,
  dummyTriggerPrefabResource,
  dummyTriggerResource,
} from "../dummydata";
import { CompressedProjectResources } from "shared/lib/resources/types";
import { ScriptEvent } from "shared/lib/entities/entitiesTypes";

describe("isProjectVersion", () => {
  test("should confirm version matches", () => {
    const input: CompressedProjectResources = {
      ...dummyCompressedProjectResources,
      metadata: {
        ...dummyCompressedProjectResources.metadata,
        _version: "4.2.1",
        _release: "1",
      },
    };
    expect(isProjectVersion("4.2.1", "1", input)).toBe(true);
  });

  test("should not match when version is different", () => {
    const input: CompressedProjectResources = {
      ...dummyCompressedProjectResources,
      metadata: {
        ...dummyCompressedProjectResources.metadata,
        _version: "4.1.1",
        _release: "1",
      },
    };
    expect(isProjectVersion("4.2.1", "1", input)).toBe(false);
  });

  test("should not match when release is different", () => {
    const input: CompressedProjectResources = {
      ...dummyCompressedProjectResources,
      metadata: {
        ...dummyCompressedProjectResources.metadata,
        _version: "4.1.1",
        _release: "2",
      },
    };
    expect(isProjectVersion("4.2.1", "1", input)).toBe(false);
  });

  test("should not match when both version and release is different", () => {
    const input: CompressedProjectResources = {
      ...dummyCompressedProjectResources,
      metadata: {
        ...dummyCompressedProjectResources.metadata,
        _version: "4.1.1",
        _release: "2",
      },
    };
    expect(isProjectVersion("3.2.0", "5", input)).toBe(false);
  });
});

describe("applyProjectResourcesMigration", () => {
  test("should apply project migration", () => {
    const input: CompressedProjectResources = {
      ...dummyCompressedProjectResources,
      metadata: {
        ...dummyCompressedProjectResources.metadata,
        _version: "4.1.1",
        _release: "1",
      },
    };
    const migration: ProjectResourcesMigration = {
      from: {
        version: "4.1.1",
        release: "1",
      },
      to: {
        version: "4.1.1",
        release: "2",
      },
      migrationFn: (resources) => {
        return {
          ...resources,
          scenes: [
            {
              ...dummyCompressedSceneResource,
              id: "test1",
              name: "Test Scene",
            },
          ],
        };
      },
    };
    const migrated = applyProjectResourcesMigration(input, migration);
    expect(migrated.metadata._version).toEqual("4.1.1");
    expect(migrated.metadata._release).toEqual("2");
    expect(migrated.scenes.length).toEqual(1);
    expect(migrated.scenes[0].id).toEqual("test1");
    expect(migrated.scenes[0].name).toEqual("Test Scene");
  });

  test("should not apply project migration when versions don't match", () => {
    const input: CompressedProjectResources = {
      ...dummyCompressedProjectResources,
      metadata: {
        ...dummyCompressedProjectResources.metadata,
        _version: "4.1.0",
        _release: "1",
      },
    };
    const migration: ProjectResourcesMigration = {
      from: {
        version: "4.1.1",
        release: "1",
      },
      to: {
        version: "4.1.1",
        release: "2",
      },
      migrationFn: (resources) => {
        return {
          ...resources,
          scenes: [
            {
              ...dummyCompressedSceneResource,
              id: "test1",
              name: "Test Scene",
            },
          ],
        };
      },
    };
    const migrated = applyProjectResourcesMigration(input, migration);
    expect(migrated).toEqual(input);
  });
});

describe("migrateEvents", () => {
  test("should migrate all project script events", () => {
    const input: CompressedProjectResources = {
      ...dummyCompressedProjectResources,
      metadata: {
        ...dummyCompressedProjectResources.metadata,
        _version: "4.1.1",
        _release: "2",
      },
      scenes: [
        {
          ...dummyCompressedSceneResource,
          script: [
            {
              id: "event1",
              command: "EVENT_TEST",
              args: {
                foo: "bar",
              },
            },
          ],
          actors: [
            {
              ...dummyActorResource,
              script: [
                {
                  id: "event2",
                  command: "EVENT_TEST2",
                  args: {
                    hello: "world",
                  },
                },
              ],
            },
          ],
          triggers: [
            {
              ...dummyTriggerResource,
              script: [
                {
                  id: "event3",
                  command: "EVENT_TEST3",
                  args: {
                    hello: "world",
                  },
                },
              ],
            },
          ],
        },
      ],
      actorPrefabs: [
        {
          ...dummyActorPrefabResource,
          script: [
            {
              id: "event4",
              command: "EVENT_TEST4",
            },
          ],
          updateScript: [
            {
              id: "event5",
              command: "EVENT_TEST5",
            },
          ],
        },
      ],
      triggerPrefabs: [
        {
          ...dummyTriggerPrefabResource,
          script: [
            {
              id: "event6",
              command: "EVENT_TEST6",
            },
          ],
          leaveScript: [
            {
              id: "event7",
              command: "EVENT_TEST7",
            },
          ],
        },
      ],
      scripts: [
        {
          ...dummyScriptResource,
          script: [
            {
              id: "event8",
              command: "EVENT_TEST8",
            },
          ],
        },
      ],
    };
    const output = migrateEvents(input, (scriptEvent) => {
      return {
        ...scriptEvent,
        command: "MIGRATED_" + scriptEvent.command,
        args: {
          ...scriptEvent.args,
          migrated: true,
        },
      };
    });

    expect(output.scenes[0].script[0].command).toEqual("MIGRATED_EVENT_TEST");
    expect(output.scenes[0].script[0].args?.migrated).toEqual(true);
    expect(output.scenes[0].actors[0].script[0].command).toEqual(
      "MIGRATED_EVENT_TEST2"
    );
    expect(output.scenes[0].actors[0].script[0].args?.migrated).toEqual(true);
    expect(output.scenes[0].triggers[0].script[0].command).toEqual(
      "MIGRATED_EVENT_TEST3"
    );
    expect(output.scenes[0].triggers[0].script[0].args?.migrated).toEqual(true);
    expect(output.actorPrefabs[0].script[0].command).toEqual(
      "MIGRATED_EVENT_TEST4"
    );
    expect(output.actorPrefabs[0].script[0].args?.migrated).toEqual(true);
    expect(output.actorPrefabs[0].updateScript[0].command).toEqual(
      "MIGRATED_EVENT_TEST5"
    );
    expect(output.actorPrefabs[0].updateScript[0].args?.migrated).toEqual(true);
    expect(output.triggerPrefabs[0].script[0].command).toEqual(
      "MIGRATED_EVENT_TEST6"
    );
    expect(output.triggerPrefabs[0].script[0].args?.migrated).toEqual(true);
    expect(output.triggerPrefabs[0].leaveScript[0].command).toEqual(
      "MIGRATED_EVENT_TEST7"
    );
    expect(output.triggerPrefabs[0].leaveScript[0].args?.migrated).toEqual(
      true
    );
    expect(output.scripts[0].script[0].command).toEqual("MIGRATED_EVENT_TEST8");
    expect(output.scripts[0].script[0].args?.migrated).toEqual(true);
  });

  test("should not make any changes to project", () => {
    const input: CompressedProjectResources = {
      ...dummyCompressedProjectResources,
      metadata: {
        ...dummyCompressedProjectResources.metadata,
        _version: "4.1.1",
        _release: "2",
      },
      scenes: [
        {
          ...dummyCompressedSceneResource,
          script: [
            {
              id: "event1",
              command: "EVENT_TEST",
              args: {
                foo: "bar",
              },
            },
          ],
          actors: [
            {
              ...dummyActorResource,
              script: [
                {
                  id: "event2",
                  command: "EVENT_TEST2",
                  args: {
                    hello: "world",
                  },
                },
              ],
            },
          ],
          triggers: [
            {
              ...dummyTriggerResource,
              script: [
                {
                  id: "event3",
                  command: "EVENT_TEST3",
                  args: {
                    hello: "world",
                  },
                },
              ],
            },
          ],
        },
      ],
      actorPrefabs: [
        {
          ...dummyActorPrefabResource,
          script: [
            {
              id: "event4",
              command: "EVENT_TEST4",
            },
          ],
          updateScript: [
            {
              id: "event5",
              command: "EVENT_TEST5",
            },
          ],
        },
      ],
      triggerPrefabs: [
        {
          ...dummyTriggerPrefabResource,
          script: [
            {
              id: "event6",
              command: "EVENT_TEST6",
            },
          ],
          leaveScript: [
            {
              id: "event7",
              command: "EVENT_TEST7",
            },
          ],
        },
      ],
      scripts: [
        {
          ...dummyScriptResource,
          script: [
            {
              id: "event8",
              command: "EVENT_TEST8",
            },
          ],
        },
      ],
    };
    const output = migrateEvents(input, (scriptEvent) => {
      return scriptEvent;
    });

    expect(output).toEqual(input);
  });
});

describe("createScriptEventsMigrator", () => {
  test("should create a ProjectResourcesMigrationFn from a ScriptEventMigrationFn", () => {
    const input: CompressedProjectResources = {
      ...dummyCompressedProjectResources,
      metadata: {
        ...dummyCompressedProjectResources.metadata,
        _version: "4.1.1",
        _release: "2",
      },
      scenes: [
        {
          ...dummyCompressedSceneResource,
          script: [
            {
              id: "event1",
              command: "EVENT_TEST",
              args: {
                foo: "bar",
              },
            },
          ],
          actors: [
            {
              ...dummyActorResource,
              script: [
                {
                  id: "event2",
                  command: "EVENT_TEST2",
                  args: {
                    hello: "world",
                  },
                },
              ],
            },
          ],
          triggers: [
            {
              ...dummyTriggerResource,
              script: [
                {
                  id: "event3",
                  command: "EVENT_TEST3",
                  args: {
                    hello: "world",
                  },
                },
              ],
            },
          ],
        },
      ],
      actorPrefabs: [
        {
          ...dummyActorPrefabResource,
          script: [
            {
              id: "event4",
              command: "EVENT_TEST4",
            },
          ],
          updateScript: [
            {
              id: "event5",
              command: "EVENT_TEST5",
            },
          ],
        },
      ],
      triggerPrefabs: [
        {
          ...dummyTriggerPrefabResource,
          script: [
            {
              id: "event6",
              command: "EVENT_TEST6",
            },
          ],
          leaveScript: [
            {
              id: "event7",
              command: "EVENT_TEST7",
            },
          ],
        },
      ],
      scripts: [
        {
          ...dummyScriptResource,
          script: [
            {
              id: "event8",
              command: "EVENT_TEST8",
            },
          ],
        },
      ],
    };
    const migrator = createScriptEventsMigrator((scriptEvent) => {
      return {
        ...scriptEvent,
        command: "MIGRATED_" + scriptEvent.command,
        args: {
          ...scriptEvent.args,
          migrated: true,
        },
      };
    });

    const output = migrator(input);

    expect(output.scenes[0].script[0].command).toEqual("MIGRATED_EVENT_TEST");
    expect(output.scenes[0].script[0].args?.migrated).toEqual(true);
    expect(output.scenes[0].actors[0].script[0].command).toEqual(
      "MIGRATED_EVENT_TEST2"
    );
    expect(output.scenes[0].actors[0].script[0].args?.migrated).toEqual(true);
    expect(output.scenes[0].triggers[0].script[0].command).toEqual(
      "MIGRATED_EVENT_TEST3"
    );
    expect(output.scenes[0].triggers[0].script[0].args?.migrated).toEqual(true);
    expect(output.actorPrefabs[0].script[0].command).toEqual(
      "MIGRATED_EVENT_TEST4"
    );
    expect(output.actorPrefabs[0].script[0].args?.migrated).toEqual(true);
    expect(output.actorPrefabs[0].updateScript[0].command).toEqual(
      "MIGRATED_EVENT_TEST5"
    );
    expect(output.actorPrefabs[0].updateScript[0].args?.migrated).toEqual(true);
    expect(output.triggerPrefabs[0].script[0].command).toEqual(
      "MIGRATED_EVENT_TEST6"
    );
    expect(output.triggerPrefabs[0].script[0].args?.migrated).toEqual(true);
    expect(output.triggerPrefabs[0].leaveScript[0].command).toEqual(
      "MIGRATED_EVENT_TEST7"
    );
    expect(output.triggerPrefabs[0].leaveScript[0].args?.migrated).toEqual(
      true
    );
    expect(output.scripts[0].script[0].command).toEqual("MIGRATED_EVENT_TEST8");
    expect(output.scripts[0].script[0].args?.migrated).toEqual(true);
  });
});

describe("pipeMigrationFns", () => {
  test("should combine multiple ProjectResourcesMigrationFns", () => {
    const input: CompressedProjectResources = {
      ...dummyCompressedProjectResources,
      metadata: {
        ...dummyCompressedProjectResources.metadata,
        _version: "4.1.1",
        _release: "2",
      },
      scenes: [
        {
          ...dummyCompressedSceneResource,
          script: [
            {
              id: "event1",
              command: "EVENT_TEST",
              args: {
                foo: "bar",
              },
            },
          ],
          actors: [
            {
              ...dummyActorResource,
              script: [
                {
                  id: "event2",
                  command: "EVENT_TEST2",
                  args: {
                    hello: "world",
                  },
                },
              ],
            },
          ],
          triggers: [
            {
              ...dummyTriggerResource,
              script: [
                {
                  id: "event3",
                  command: "EVENT_TEST3",
                  args: {
                    hello: "world",
                  },
                },
              ],
            },
          ],
        },
      ],
      actorPrefabs: [
        {
          ...dummyActorPrefabResource,
          script: [
            {
              id: "event4",
              command: "EVENT_TEST4",
            },
          ],
          updateScript: [
            {
              id: "event5",
              command: "EVENT_TEST5",
            },
          ],
        },
      ],
      triggerPrefabs: [
        {
          ...dummyTriggerPrefabResource,
          script: [
            {
              id: "event6",
              command: "EVENT_TEST6",
            },
          ],
          leaveScript: [
            {
              id: "event7",
              command: "EVENT_TEST7",
            },
          ],
        },
      ],
      scripts: [
        {
          ...dummyScriptResource,
          script: [
            {
              id: "event8",
              command: "EVENT_TEST8",
            },
          ],
        },
      ],
    };
    const migrator = createScriptEventsMigrator((scriptEvent) => {
      return {
        ...scriptEvent,
        command: "MIGRATED_" + scriptEvent.command,
        args: {
          ...scriptEvent.args,
          migrated: true,
        },
      };
    });
    const migrator2 = createScriptEventsMigrator((scriptEvent) => {
      return {
        ...scriptEvent,
        command: "SECONDMIGRATION_" + scriptEvent.command,
        args: {
          ...scriptEvent.args,
          migratedAgain: true,
        },
      };
    });

    const combinedMigrations = pipeMigrationFns([migrator, migrator2]);

    const output = combinedMigrations(input);

    expect(output.scenes[0].script[0].command).toEqual(
      "SECONDMIGRATION_MIGRATED_EVENT_TEST"
    );
    expect(output.scenes[0].script[0].args?.migrated).toEqual(true);
    expect(output.scenes[0].script[0].args?.migratedAgain).toEqual(true);
    expect(output.scenes[0].actors[0].script[0].command).toEqual(
      "SECONDMIGRATION_MIGRATED_EVENT_TEST2"
    );
    expect(output.scenes[0].actors[0].script[0].args?.migrated).toEqual(true);
    expect(output.scenes[0].actors[0].script[0].args?.migratedAgain).toEqual(
      true
    );
    expect(output.scenes[0].triggers[0].script[0].command).toEqual(
      "SECONDMIGRATION_MIGRATED_EVENT_TEST3"
    );
    expect(output.scenes[0].triggers[0].script[0].args?.migrated).toEqual(true);
    expect(output.scenes[0].triggers[0].script[0].args?.migratedAgain).toEqual(
      true
    );
    expect(output.actorPrefabs[0].script[0].command).toEqual(
      "SECONDMIGRATION_MIGRATED_EVENT_TEST4"
    );
    expect(output.actorPrefabs[0].script[0].args?.migrated).toEqual(true);
    expect(output.actorPrefabs[0].script[0].args?.migratedAgain).toEqual(true);
    expect(output.actorPrefabs[0].updateScript[0].command).toEqual(
      "SECONDMIGRATION_MIGRATED_EVENT_TEST5"
    );
    expect(output.actorPrefabs[0].updateScript[0].args?.migrated).toEqual(true);
    expect(output.actorPrefabs[0].updateScript[0].args?.migratedAgain).toEqual(
      true
    );
    expect(output.triggerPrefabs[0].script[0].command).toEqual(
      "SECONDMIGRATION_MIGRATED_EVENT_TEST6"
    );
    expect(output.triggerPrefabs[0].script[0].args?.migrated).toEqual(true);
    expect(output.triggerPrefabs[0].script[0].args?.migratedAgain).toEqual(
      true
    );
    expect(output.triggerPrefabs[0].leaveScript[0].command).toEqual(
      "SECONDMIGRATION_MIGRATED_EVENT_TEST7"
    );
    expect(output.triggerPrefabs[0].leaveScript[0].args?.migrated).toEqual(
      true
    );
    expect(output.scripts[0].script[0].command).toEqual(
      "SECONDMIGRATION_MIGRATED_EVENT_TEST8"
    );
    expect(output.scripts[0].script[0].args?.migrated).toEqual(true);
  });
});

describe("pipeScriptEventMigrationFns", () => {
  test("should combine multiple ScriptEventMigrationFn", () => {
    const input: CompressedProjectResources = {
      ...dummyCompressedProjectResources,
      metadata: {
        ...dummyCompressedProjectResources.metadata,
        _version: "4.1.1",
        _release: "2",
      },
      scenes: [
        {
          ...dummyCompressedSceneResource,
          script: [
            {
              id: "event1",
              command: "EVENT_TEST",
              args: {
                foo: "bar",
              },
            },
          ],
          actors: [
            {
              ...dummyActorResource,
              script: [
                {
                  id: "event2",
                  command: "EVENT_TEST2",
                  args: {
                    hello: "world",
                  },
                },
              ],
            },
          ],
          triggers: [
            {
              ...dummyTriggerResource,
              script: [
                {
                  id: "event3",
                  command: "EVENT_TEST3",
                  args: {
                    hello: "world",
                  },
                },
              ],
            },
          ],
        },
      ],
      actorPrefabs: [
        {
          ...dummyActorPrefabResource,
          script: [
            {
              id: "event4",
              command: "EVENT_TEST4",
            },
          ],
          updateScript: [
            {
              id: "event5",
              command: "EVENT_TEST5",
            },
          ],
        },
      ],
      triggerPrefabs: [
        {
          ...dummyTriggerPrefabResource,
          script: [
            {
              id: "event6",
              command: "EVENT_TEST6",
            },
          ],
          leaveScript: [
            {
              id: "event7",
              command: "EVENT_TEST7",
            },
          ],
        },
      ],
      scripts: [
        {
          ...dummyScriptResource,
          script: [
            {
              id: "event8",
              command: "EVENT_TEST8",
            },
          ],
        },
      ],
    };
    const fn1 = (scriptEvent: ScriptEvent) => {
      return {
        ...scriptEvent,
        command: "MIGRATED_" + scriptEvent.command,
        args: {
          ...scriptEvent.args,
          migrated: true,
        },
      };
    };
    const fn2 = (scriptEvent: ScriptEvent) => {
      return {
        ...scriptEvent,
        command: "SECONDMIGRATION_" + scriptEvent.command,
        args: {
          ...scriptEvent.args,
          migratedAgain: true,
        },
      };
    };

    const combinedMigrations = createScriptEventsMigrator(
      pipeScriptEventMigrationFns([fn1, fn2])
    );

    const output = combinedMigrations(input);

    expect(output.scenes[0].script[0].command).toEqual(
      "SECONDMIGRATION_MIGRATED_EVENT_TEST"
    );
    expect(output.scenes[0].script[0].args?.migrated).toEqual(true);
    expect(output.scenes[0].script[0].args?.migratedAgain).toEqual(true);
    expect(output.scenes[0].actors[0].script[0].command).toEqual(
      "SECONDMIGRATION_MIGRATED_EVENT_TEST2"
    );
    expect(output.scenes[0].actors[0].script[0].args?.migrated).toEqual(true);
    expect(output.scenes[0].actors[0].script[0].args?.migratedAgain).toEqual(
      true
    );
    expect(output.scenes[0].triggers[0].script[0].command).toEqual(
      "SECONDMIGRATION_MIGRATED_EVENT_TEST3"
    );
    expect(output.scenes[0].triggers[0].script[0].args?.migrated).toEqual(true);
    expect(output.scenes[0].triggers[0].script[0].args?.migratedAgain).toEqual(
      true
    );
    expect(output.actorPrefabs[0].script[0].command).toEqual(
      "SECONDMIGRATION_MIGRATED_EVENT_TEST4"
    );
    expect(output.actorPrefabs[0].script[0].args?.migrated).toEqual(true);
    expect(output.actorPrefabs[0].script[0].args?.migratedAgain).toEqual(true);
    expect(output.actorPrefabs[0].updateScript[0].command).toEqual(
      "SECONDMIGRATION_MIGRATED_EVENT_TEST5"
    );
    expect(output.actorPrefabs[0].updateScript[0].args?.migrated).toEqual(true);
    expect(output.actorPrefabs[0].updateScript[0].args?.migratedAgain).toEqual(
      true
    );
    expect(output.triggerPrefabs[0].script[0].command).toEqual(
      "SECONDMIGRATION_MIGRATED_EVENT_TEST6"
    );
    expect(output.triggerPrefabs[0].script[0].args?.migrated).toEqual(true);
    expect(output.triggerPrefabs[0].script[0].args?.migratedAgain).toEqual(
      true
    );
    expect(output.triggerPrefabs[0].leaveScript[0].command).toEqual(
      "SECONDMIGRATION_MIGRATED_EVENT_TEST7"
    );
    expect(output.triggerPrefabs[0].leaveScript[0].args?.migrated).toEqual(
      true
    );
    expect(output.scripts[0].script[0].command).toEqual(
      "SECONDMIGRATION_MIGRATED_EVENT_TEST8"
    );
    expect(output.scripts[0].script[0].args?.migrated).toEqual(true);
  });
});
