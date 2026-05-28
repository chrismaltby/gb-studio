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

/******************************************************************************
 * Global Variables
 */

export const globalVariableName = (
  variable: string,
  variablesLookup: VariablesLookup,
) => {
  return variablesLookup[variable]?.name || globalVariableDefaultName(variable);
};

export const globalVariableDefaultName = (variable: string) => {
  return `Variable ${variable}`;
};

export const globalVariableCode = (variable: string) => {
  return variable.padStart(2, "0");
};

/******************************************************************************
 * Next Variable ID
 */

export const getNextVariableId = (variable: string): string => {
  const localMatch = variable.match(/^L([0-5])$/);
  if (localMatch) {
    const nextNumber = Number(localMatch[1]) + 1;
    return nextNumber > 5 ? "0" : `L${nextNumber}`;
  }

  const argsMatch = variable.match(/^V([0-9])$/);
  if (argsMatch) {
    const nextNumber = Number(argsMatch[1]) + 1;
    return nextNumber > 9 ? "0" : `V${nextNumber}`;
  }

  const tempMatch = variable.match(/^T([0-1])$/);
  if (tempMatch) {
    const nextNumber = Number(tempMatch[1]) + 1;
    return nextNumber > 1 ? "0" : `T${nextNumber}`;
  }

  const numberMatch = variable.match(/^\d+$/);
  if (numberMatch) {
    return String(Number(variable) + 1);
  }

  return "0";
};
