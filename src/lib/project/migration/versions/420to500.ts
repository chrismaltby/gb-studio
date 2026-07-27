import {
  migrateEvents,
  ProjectResourcesMigration,
  ProjectResourcesMigrationFn,
} from "lib/project/migration/helpers";
import { genSymbol } from "shared/lib/helpers/symbols";
import { Variable } from "shared/lib/resources/types";
import { extractVariableIdsFromScriptEvent } from "shared/lib/variables/extractVariableReferences";

type LegacyVariable = {
  id: string;
  name: string;
  symbol: string;
  flags?: Record<string, string>;
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

  const migratedResources = migrateEvents(resources, (scriptEvent) => {
    const variableIds = extractVariableIdsFromScriptEvent(
      scriptEvent,
      context.scriptEventDefs,
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
  });

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
        name: `Variable ${variableId}`,
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
  migrationFn: migrateFrom420r10To500r1Variables,
};
