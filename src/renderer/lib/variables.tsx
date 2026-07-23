import { ScriptEditorCtx } from "shared/lib/scripts/context";
import uniq from "lodash/uniq";
import { ScriptNormalized } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import {
  customEventVariableCode,
  customEventVariableName,
  globalVariableCode,
  globalVariableDefaultName,
  isGlobalVariableId,
  localVariableCode,
  localVariableName,
  tempVariableCode,
  tempVariableName,
  MAX_GLOBAL_VARIABLES,
} from "shared/lib/variables/variableNames";
import {
  getBaseName,
  getParentPath,
} from "shared/lib/helpers/virtualFilesystem";
import { Variable } from "shared/lib/resources/types";

const arrayNStrings = (n: number) =>
  Array.from(Array(n).keys()).map((n) => String(n));

export const allVariables = arrayNStrings(MAX_GLOBAL_VARIABLES);
const localVariables = arrayNStrings(6);
const tempVariables = arrayNStrings(2);
const customEventVariables = arrayNStrings(10);

type VariablesLookup = { [name: string]: Variable | undefined };

export interface NamedVariable {
  id: string; // The id to use in dropdown value
  code: string; // The code to use in dialogue (when wrapped by $ or #)
  name: string; // The user defined name or default when not named
  group: string; // Group name that variable belongs to
}

interface VariableGroup {
  name: string; // The group name
  variables: NamedVariable[]; // Variables in the group
}

/******************************************************************************
 * Available Variables List (for using in Dropdowns etc)
 */

// Global variables defined in the project (explicitly added or migrated on
// load). Only these appear in dropdowns — variables are added first via the
// variables navigator, like constants.
export const definedGlobalVariableEntities = (
  variablesLookup: VariablesLookup,
): Variable[] => {
  return Object.values(variablesLookup).filter(
    (variable): variable is Variable =>
      !!variable && isGlobalVariableId(variable.id),
  );
};

const namedDefinedGlobalVariables = (
  variablesLookup: VariablesLookup,
): NamedVariable[] => {
  return definedGlobalVariableEntities(variablesLookup).map((variable) => {
    const displayName =
      getBaseName(variable.name) || globalVariableDefaultName(variable.id);
    const folder = getParentPath(variable.name);
    return {
      id: variable.id,
      code: globalVariableCode(variable.id),
      name: displayName,
      group: folder || l10n("FIELD_GLOBAL"),
    };
  });
};

export const namedVariablesByContext = (
  context: ScriptEditorCtx,
  variablesLookup: VariablesLookup,
  customEvent: ScriptNormalized | undefined,
): NamedVariable[] => {
  if (context.type === "script") {
    if (customEvent) {
      return namedCustomEventVariables(customEvent, variablesLookup);
    }
    return [];
  } else if (context.type === "entity" || context.type === "prefab") {
    return namedEntityVariables(context.entityId, variablesLookup);
  } else {
    return namedGlobalVariables(variablesLookup);
  }
};

export const namedCustomEventVariables = (
  customEvent: ScriptNormalized,
  variablesLookup: VariablesLookup,
): NamedVariable[] => {
  return ([] as NamedVariable[]).concat(
    customEventVariables.map((variable) => ({
      id: customEventVariableCode(variable),
      code: customEventVariableCode(variable),
      name: customEventVariableName(variable, customEvent),
      group: l10n("SIDEBAR_PARAMETERS"),
    })),
    namedDefinedGlobalVariables(variablesLookup),
  );
};

const namedEntityVariables = (
  entityId: string,
  variablesLookup: VariablesLookup,
): NamedVariable[] => {
  return ([] as NamedVariable[]).concat(
    localVariables.map((variable) => ({
      id: localVariableCode(variable),
      code: localVariableCode(variable),
      name: localVariableName(variable, entityId, variablesLookup),
      group: l10n("FIELD_LOCAL"),
    })),
    tempVariables.map((variable) => ({
      id: tempVariableCode(variable),
      code: tempVariableCode(variable),
      name: tempVariableName(variable),
      group: l10n("FIELD_TEMPORARY"),
    })),
    namedDefinedGlobalVariables(variablesLookup),
  );
};

const namedGlobalVariables = (
  variablesLookup: VariablesLookup,
): NamedVariable[] => {
  return namedDefinedGlobalVariables(variablesLookup);
};

export const groupVariables = (variables: NamedVariable[]): VariableGroup[] => {
  const groups = uniq(variables.map((f) => f.group));
  return groups.map((g) => {
    const groupVariables = variables.filter((f) => f.group === g);
    return {
      name: g,
      variables: groupVariables,
    };
  });
};

/*****************************************************************************/

export const prevVariable = (variable = "0") => {
  const start = variable[0];
  if (start === "T" || start === "L") {
    const value = parseInt(variable.substr(1), 10) - 1;
    return `${start}${value}`;
  }
  return String(parseInt(variable, 10) - 1);
};

export const nextVariable = (variable = "0") => {
  const start = variable[0];
  if (start === "T" || start === "L") {
    const value = parseInt(variable.substr(1), 10) + 1;
    return `${start}${value}`;
  }
  return String(parseInt(variable, 10) + 1);
};
