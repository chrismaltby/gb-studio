import type { ScriptNormalized } from "shared/lib/entities/entitiesTypes";
import { Variable } from "shared/lib/resources/types";

type VariablesLookup = { [name: string]: Variable | undefined };

/******************************************************************************
 * Custom Event Variables
 */

export const customEventVariableName = (
  variable: string,
  customEvent: ScriptNormalized,
): string => {
  const customEventVariable = customEvent.variables[`V${variable}`];
  if (customEventVariable) {
    return customEventVariable.name;
  }
  const letter = String.fromCharCode(
    "A".charCodeAt(0) + parseInt(variable, 10),
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
  variablesLookup: VariablesLookup,
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

export const globalVariableCode = (variable: string) => {
  return variable.padStart(2, "0");
};

export const variableDisplayName = (
  name: string,
  arraySize?: number | null,
): string => {
  if (arraySize === null) {
    return `${name}[]`;
  }
  if (arraySize !== undefined) {
    return `${name}[${arraySize}]`;
  }
  return name;
};
