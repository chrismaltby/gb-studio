import type {
  CustomEventNormalized,
  Variable,
} from "shared/lib/entities/entitiesTypes";

const arrayNStrings = (n: number) =>
  Array.from(Array(n).keys()).map((n) => String(n));

const allVariables = arrayNStrings(512);
const localVariables = arrayNStrings(6);
const tempVariables = arrayNStrings(2);
const customEventVariables = arrayNStrings(10);

type VariablesLookup = { [name: string]: Variable | undefined };

/******************************************************************************
 * Custom Event Variables
 */

export const customEventVariableName = (
  variable: string,
  customEvent: CustomEventNormalized,
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
