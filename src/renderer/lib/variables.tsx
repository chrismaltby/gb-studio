import { ScriptEditorCtx } from "shared/lib/scripts/context";
import uniq from "lodash/uniq";
import { ScriptNormalized } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import {
  customEventVariableCode,
  customEventVariableName,
  globalVariableCode,
  localVariableCode,
  localVariableName,
  tempVariableCode,
  tempVariableName,
  variableDisplayName,
} from "shared/lib/variables/variableNames";
import { Variable } from "shared/lib/resources/types";
import { sortByName } from "shared/lib/helpers/sort";
import { variableName } from "shared/lib/entities/entitiesHelpers";
import keyBy from "lodash/keyBy";

const arrayNStrings = (n: number) =>
  Array.from(Array(n).keys()).map((n) => String(n));

const localVariables = arrayNStrings(6);
const tempVariables = arrayNStrings(2);
const customEventVariables = arrayNStrings(10);

type VariablesLookup = { [name: string]: Variable | undefined };

export interface NamedVariable {
  id: string; // The id to use in dropdown value
  code: string; // The code to use in dialogue (when wrapped by $ or #)
  name: string; // The plain name used when rendering mention tags
  displayName: string; // The name, including array size, shown in lists
  group: string; // Group name that variable belongs to
}

interface VariableGroup {
  name: string; // The group name
  variables: NamedVariable[]; // Variables in the group
}

/******************************************************************************
 * Available Variables List (for using in Dropdowns etc)
 */

export const namedVariablesByContext = (
  context: ScriptEditorCtx,
  variables: Variable[],
  customEvent: ScriptNormalized | undefined,
): NamedVariable[] => {
  const variablesLookup = keyBy(variables, "id");
  if (context.type === "script") {
    if (customEvent) {
      return namedCustomEventVariables(customEvent, variables);
    }
    return [];
  } else if (context.type === "entity" || context.type === "prefab") {
    return namedEntityVariables(context.entityId, variables, variablesLookup);
  } else {
    return namedGlobalVariables(variables);
  }
};

export const namedCustomEventVariables = (
  customEvent: ScriptNormalized,
  variables: Variable[],
): NamedVariable[] => {
  return ([] as NamedVariable[]).concat(
    customEventVariables.map((variable) => {
      const id = customEventVariableCode(variable);
      const name = customEventVariableName(variable, customEvent);
      return {
        id,
        code: id,
        name,
        displayName: variableDisplayName(
          name,
          customEvent.variables[id]?.passByReference === "array"
            ? customEvent.variables[id].size
            : undefined,
        ),
        group: l10n("SIDEBAR_PARAMETERS"),
      };
    }),
    namedGlobalVariables(variables),
  );
};

const namedEntityVariables = (
  entityId: string,
  variables: Variable[],
  variablesLookup: VariablesLookup,
): NamedVariable[] => {
  return ([] as NamedVariable[]).concat(
    localVariables.map((variable) => {
      const name = localVariableName(variable, entityId, variablesLookup);
      return {
        id: localVariableCode(variable),
        code: localVariableCode(variable),
        name,
        displayName: name,
        group: l10n("FIELD_LOCAL"),
      };
    }),
    tempVariables.map((variable) => {
      const name = tempVariableName(variable);
      return {
        id: tempVariableCode(variable),
        code: tempVariableCode(variable),
        name,
        displayName: name,
        group: l10n("FIELD_TEMPORARY"),
      };
    }),
    namedGlobalVariables(variables),
  );
};

const isGlobalVariable = (variable: Variable) => !variable.id.includes("__L");

const namedGlobalVariables = (variables: Variable[]): NamedVariable[] =>
  variables
    .filter(isGlobalVariable)
    .map((variable, index) => {
      const name = variableName(variable, index);
      return {
        id: variable.id,
        code: globalVariableCode(variable.id),
        name,
        displayName: variableDisplayName(
          name,
          variable.type === "array" ? variable.size : undefined,
        ),
        group: l10n("FIELD_GLOBAL"),
      };
    })
    .sort(sortByName);

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
