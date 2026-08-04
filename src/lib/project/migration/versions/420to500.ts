import {
  createScriptEventsMigrator,
  migrateEvents,
  pipeMigrationFns,
  ProjectResourcesMigration,
  ProjectResourcesMigrationFn,
  ScriptEventMigrationFn,
} from "lib/project/migration/helpers";
import { genSymbol } from "shared/lib/helpers/symbols";
import { Variable } from "shared/lib/resources/types";
import { extractVariableIdsFromScriptEvent } from "shared/lib/variables/extractVariableReferences";
import scriptEventDefs420Snapshot from "lib/project/migration/snapshots/scriptEventDefs420.json";
import {
  scriptEventDefsFromSnapshot,
  ScriptEventDefsSnapshot,
} from "lib/project/migration/snapshots/scriptEventDefs";
import type { ScriptEventDefsFieldTypeLookup } from "shared/lib/scripts/scriptDefHelpers";

const scriptEventDefs420 = scriptEventDefsFromSnapshot(
  scriptEventDefs420Snapshot as ScriptEventDefsSnapshot,
);

const scriptEventDefsForMigration = (
  currentScriptEventDefs: ScriptEventDefsFieldTypeLookup = {},
): ScriptEventDefsFieldTypeLookup => ({
  ...currentScriptEventDefs,
  ...scriptEventDefs420,
});

type LegacyVariable = {
  id: string;
  name: string;
  symbol: string;
  flags?: Record<string, string>;
};

type LegacyScriptDataTable = {
  label?: string;
  variables: string[];
  rows: unknown[];
};

const isLegacyScriptDataTable = (
  value: unknown,
): value is LegacyScriptDataTable =>
  typeof value === "object" &&
  value !== null &&
  "variables" in value &&
  Array.isArray(value.variables) &&
  value.variables.every((variable) => typeof variable === "string") &&
  "rows" in value &&
  Array.isArray(value.rows);

export const migrateFrom420r10To500r1DataTables: ScriptEventMigrationFn = (
  scriptEvent,
  context,
) => {
  if (!scriptEvent.args) {
    return scriptEvent;
  }
  const scriptEventDefs = scriptEventDefsForMigration(context?.scriptEventDefs);
  const fieldsLookup = scriptEventDefs[scriptEvent.command]?.fieldsLookup;
  let changed = false;
  const args = Object.fromEntries(
    Object.entries(scriptEvent.args).map(([key, value]) => {
      if (fieldsLookup?.[key]?.type !== "dataTable") {
        return [key, value];
      }
      if (!isLegacyScriptDataTable(value)) {
        return [key, value];
      }
      changed = true;
      return [
        key,
        {
          ...value,
          variables: value.variables.map((variable) => ({
            type: "variable" as const,
            value: variable,
          })),
        },
      ];
    }),
  );
  return changed ? { ...scriptEvent, args } : scriptEvent;
};

export const migrateFrom420r10To500r1DataPeek: ScriptEventMigrationFn = (
  scriptEvent,
) => {
  if (
    scriptEvent.command !== "EVENT_PEEK_DATA" ||
    typeof scriptEvent.args?.variableSource !== "string"
  ) {
    return scriptEvent;
  }
  return {
    ...scriptEvent,
    args: {
      ...scriptEvent.args,
      variableSource: {
        type: "variable",
        value: scriptEvent.args.variableSource,
      },
    },
  };
};

// Create global variable entry for all variable references
export const migrateFrom420r10To500r1Variables: ProjectResourcesMigrationFn = (
  resources,
  context,
) => {
  const globalVariables = resources.variables
    .variables as unknown as LegacyVariable[];
  const migratedGlobalVariables: Variable[] = globalVariables.map(
    (variable) => ({
      ...variable,
      type: "number",
    }),
  );
  const existingVariableIds = new Set(
    globalVariables.map((variable) => variable.id),
  );
  const usedLegacyVariableIds = new Set<string>();

  const scriptEventDefs = scriptEventDefsForMigration(context.scriptEventDefs);

  const migratedResources = migrateEvents(
    resources,
    (scriptEvent) => {
      const variableIds = extractVariableIdsFromScriptEvent(
        scriptEvent,
        scriptEventDefs,
      );
      for (const variableId of variableIds) {
        const variableNumber = Number(variableId);
        if (
          /^\d+$/.test(variableId) &&
          variableNumber >= 0 &&
          variableNumber < 512 &&
          !existingVariableIds.has(variableId)
        ) {
          usedLegacyVariableIds.add(variableId);
        }
      }
      return scriptEvent;
    },
    context,
  );

  const existingSymbols = new Set(
    globalVariables.map((variable) => variable.symbol),
  );
  const newGlobalVariables: Variable[] = Array.from(usedLegacyVariableIds)
    .sort((a, b) => Number(a) - Number(b))
    .map((variableId) => {
      const symbol = genSymbol(`var_${variableId}`, existingSymbols);
      existingSymbols.add(symbol);
      return {
        id: variableId,
        name: "",
        symbol,
        type: "number",
      };
    });

  return {
    ...migratedResources,
    variables: {
      ...resources.variables,
      variables: [...migratedGlobalVariables, ...newGlobalVariables],
    },
  };
};

export const migrate420r10To500r1: ProjectResourcesMigration = {
  from: { version: "4.2.0", release: "10" },
  to: { version: "5.0.0", release: "1" },
  migrationFn: pipeMigrationFns([
    createScriptEventsMigrator(migrateFrom420r10To500r1DataTables),
    createScriptEventsMigrator(migrateFrom420r10To500r1DataPeek),
    migrateFrom420r10To500r1Variables,
  ]),
};
