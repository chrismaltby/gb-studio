/**
 * Migrations that run on raw resource data before it is cast with
 * `Value.Cast`, for shape changes where casting old data against the
 * current schema would be lossy.
 */

export type RawResourceMigration = {
  resourceType: string;
  appliesToVersion: (version: string, release: string) => boolean;
  migrate: (data: unknown) => unknown;
};

const projectMajorVersion = (version: string): number => {
  const major = parseInt(version.split(".")[0] ?? "", 10);
  return Number.isNaN(major) ? 0 : major;
};

/**
 * Pre-5.0.0 projects store variables without a `type` field. Casting them
 * against the `Variable` schema (an intersect discriminated on `type`)
 * drops optional fields such as `flags` (custom flag names). See #2181.
 */
export const migrateRawVariableTypes: RawResourceMigration = {
  resourceType: "variables",
  appliesToVersion: (version) => projectMajorVersion(version) < 5,
  migrate: (data) => {
    if (
      !data ||
      typeof data !== "object" ||
      !Array.isArray((data as Record<string, unknown>).variables)
    ) {
      return data;
    }
    const record = data as Record<string, unknown>;
    const variables = record.variables as unknown[];
    return {
      ...record,
      variables: variables.map((variable) =>
        variable && typeof variable === "object" && !("type" in variable)
          ? { ...(variable as Record<string, unknown>), type: "number" }
          : variable,
      ),
    };
  },
};

const rawResourceMigrations: RawResourceMigration[] = [migrateRawVariableTypes];

export const migrateRawResource = (
  data: unknown,
  version: string,
  release: string,
): unknown => {
  if (!data || typeof data !== "object") {
    return data;
  }
  const resourceType = (data as Record<string, unknown>)._resourceType;
  return rawResourceMigrations.reduce<unknown>(
    (currentData, migration) =>
      migration.resourceType === resourceType &&
      migration.appliesToVersion(version, release)
        ? migration.migrate(currentData)
        : currentData,
    data,
  );
};
