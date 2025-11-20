import { CompressedProjectResources } from "shared/lib/resources/types";
import {
  ProjectResourcesMigration,
  applyProjectResourcesMigration,
} from "./helpers";
import {
  migrate410r1To420r1,
  migrate420r1To420r2,
  migrate420r2To420r3,
  migrate420r3To420r4,
  migrate420r4To420r5,
  migrate420r5To420r6,
  migrate420r6To420r7,
  migrate420r7To420r8,
} from "./versions/410to420";

const migrations: ProjectResourcesMigration[] = [
  // 4.1.0 to 4.2.0
  migrate410r1To420r1,
  migrate420r1To420r2,
  migrate420r2To420r3,
  migrate420r3To420r4,
  migrate420r4To420r5,
  migrate420r5To420r6,
  migrate420r6To420r7,
  migrate420r7To420r8,
];

const lastMigration = migrations[migrations.length - 1];

export const LATEST_PROJECT_VERSION = lastMigration.to.version;
export const LATEST_PROJECT_MINOR_VERSION = lastMigration.to.release;

export const migrateProjectResources = async (
  resources: CompressedProjectResources,
): Promise<CompressedProjectResources> => {
  return migrations.reduce((migratedResources, migration) => {
    return applyProjectResourcesMigration(migratedResources, migration);
  }, resources);
};
