import cloneDeep from "lodash/cloneDeep";
import {
  LATEST_PROJECT_MINOR_VERSION,
  LATEST_PROJECT_VERSION,
  migrateProjectResources,
} from "lib/project/migration/migrateProjectResources";
import { migrationTestProject } from "./data/migrationTestProject";
import { migrateEvents } from "lib/project/migration/helpers";

describe("migrateProjectResources", () => {
  // Keep a clone before any migrations take place to allow
  // confirming that input data was not mutated
  const clonedProject = cloneDeep(migrationTestProject);

  test("should migrate to latest version without errors", async () => {
    const project = migrationTestProject;
    const migrated = await migrateProjectResources(project);
    expect(migrated.metadata._version).toEqual(LATEST_PROJECT_VERSION);
    expect(migrated.metadata._release).toEqual(LATEST_PROJECT_MINOR_VERSION);
  });

  test("should not mutate input data", async () => {
    const project = migrationTestProject;
    await migrateProjectResources(project);
    expect(project).toEqual(clonedProject);
  });

  test("should use constvalues in switch event values", async () => {
    const project = migrationTestProject;
    const migrated = await migrateProjectResources(project);
    expect(migrated.scripts[0].script[0].args?.value0).toEqual({
      type: "number",
      value: 1,
    });
    expect(migrated.scripts[0].script[0].args?.value1).toEqual({
      type: "number",
      value: 1,
    });
    expect(migrated.scripts[0].script[0].args?.value2).toEqual({
      type: "number",
      value: 10,
    });
  });
});
