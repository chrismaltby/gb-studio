import { ScriptEditorContextType } from "components/script/ScriptEditorContext";
import uniq from "lodash/uniq";
import { CustomEvent, Variable } from "store/features/entities/entitiesTypes";
import l10n from "./l10n";

const arrayNStrings = (n: number) =>
  Array.from(Array(n).keys()).map((n) => String(n));

export const allVariables = arrayNStrings(512);
export const localVariables = arrayNStrings(6);
export const tempVariables = arrayNStrings(2);
export const customEventVariables = arrayNStrings(10);

type VariablesLookup = { [name: string]: Variable | undefined };

export interface NamedVariable {
  id: string; // The id to use in dropdown value
  code: string; // The code to use in dialogue (when wrapped by $ or #)
  name: string; // The user defined name or default when not named
  group: string; // Group name that variable belongs to
}

export interface VariableGroup {
  name: string; // The group name
  variables: NamedVariable[]; // Variables in the group
}

/******************************************************************************
 * Available Variables List (for using in Dropdowns etc)
 */

export const namedVariablesByContext = (
  context: ScriptEditorContextType,
  entityId: string,
  variablesLookup: VariablesLookup,
  customEvent: CustomEvent | undefined
): NamedVariable[] => {
  if (context === "script") {
    if (customEvent) {
      return namedCustomEventVariables(customEvent, variablesLookup);
    }
    return [];
  } else if (context === "entity") {
    return namedEntityVariables(entityId, variablesLookup);
  } else {
    return namedGlobalVariables(variablesLookup);
  }
};

export const namedCustomEventVariables = (
  customEvent: CustomEvent,
  variablesLookup: VariablesLookup
): NamedVariable[] => {
  return ([] as NamedVariable[]).concat(
    customEventVariables.map((variable) => ({
      id: customEventVariableCode(variable),
      code: customEventVariableCode(variable),
      name: customEventVariableName(variable, customEvent),
      group: l10n("SIDEBAR_PARAMETERS"),
    })),
    allVariables.map((variable) => ({
      id: variable,
      code: globalVariableCode(variable),
      name: globalVariableName(variable, variablesLookup),
      group: l10n("FIELD_GLOBAL"),
    }))
  );
};

export const namedEntityVariables = (
  entityId: string,
  variablesLookup: VariablesLookup
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
    allVariables.map((variable) => ({
      id: variable,
      code: globalVariableCode(variable),
      name: globalVariableName(variable, variablesLookup),
      group: l10n("FIELD_GLOBAL"),
    }))
  );
};

export const namedGlobalVariables = (
  variablesLookup: VariablesLookup
): NamedVariable[] => {
  return ([] as NamedVariable[]).concat(
    allVariables.map((variable) => ({
      id: variable,
      code: globalVariableCode(variable),
      name: globalVariableName(variable, variablesLookup),
      group: "",
    }))
  );
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

/******************************************************************************
 * Custom Event Variables
 */

export const customEventVariableName = (
  variable: string,
  customEvent: CustomEvent
): string => {
  const customEventVariable = customEvent.variables[variable];
  if (customEventVariable) {
    return customEventVariable.name;
  }
  const letter = String.fromCharCode(
    "A".charCodeAt(0) + parseInt(variable, 10)
  );
  return `Variable ${letter}`;
};

export const customEventVariableCode = (variable: string) => {
  return `V${variable}`;
};

/******************************************************************************
 * Local Variables
 */

export const localVariableName = (
  variable: string,
  entityId: string,
  variablesLookup: VariablesLookup
) => {
  return (
    variablesLookup[`${entityId}__L${variable}`]?.name || `Local ${variable}`
  );
};

export const localVariableCode = (variable: string) => {
  return `L${variable}`;
};

/******************************************************************************
 * Temp Variables
 */

export const tempVariableName = (variable: string) => {
  return `Temp ${variable}`;
};

export const tempVariableCode = (variable: string) => {
  return `T${variable}`;
};

/******************************************************************************
 * Global Variables
 */

export const globalVariableName = (
  variable: string,
  variablesLookup: VariablesLookup
) => {
  return variablesLookup[variable]?.name || globalVariableDefaultName(variable);
};

export const globalVariableDefaultName = (variable: string) => {
  return `Variable ${variable}`;
};

export const globalVariableCode = (variable: string) => {
  return variable.padStart(2, "0");
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
