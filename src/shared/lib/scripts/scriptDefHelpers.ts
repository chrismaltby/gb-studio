import type { Dictionary } from "@reduxjs/toolkit";
import type { ScriptEventDef } from "lib/project/loadScriptEvents";
import type {
  ScriptEventArgs,
  ScriptEventFieldSchema,
} from "shared/lib/entities/entitiesTypes";
import {
  isUnionPropertyValue,
  isUnionVariableValue,
} from "shared/lib/entities/entitiesHelpers";

export type ScriptEventDefsLookup = Dictionary<ScriptEventDef>;

export const isFieldVisible = (
  field: ScriptEventFieldSchema,
  args: ScriptEventArgs
) => {
  if (!field.conditions) {
    return true;
  }
  // Determine if field conditions are met
  return field.conditions.reduce((memo, condition) => {
    const keyValue = args[condition.key];
    return (
      memo &&
      (!condition.eq || keyValue === condition.eq) &&
      (!condition.ne || keyValue !== condition.ne) &&
      (!condition.gt || Number(keyValue) > Number(condition.gt)) &&
      (!condition.gte || Number(keyValue) >= Number(condition.gte)) &&
      (!condition.lt || Number(keyValue) > Number(condition.lt)) &&
      (!condition.lte || Number(keyValue) >= Number(condition.lte)) &&
      (!condition.in || condition.in.indexOf(keyValue) >= 0) &&
      (condition.set === undefined ||
        (condition.set && keyValue !== undefined) ||
        (!condition.set && keyValue === undefined))
    );
  }, true);
};

export const getField = (
  cmd: string,
  fieldName: string,
  scriptEventDefsLookup: ScriptEventDefsLookup
): ScriptEventFieldSchema | undefined => {
  const event = scriptEventDefsLookup[cmd];
  if (!event) return undefined;
  return event.fieldsLookup[fieldName];
};

export const isVariableField = (
  command: string,
  fieldName: string,
  args: ScriptEventArgs,
  scriptEventDefsLookup: ScriptEventDefsLookup
) => {
  // Custom event calls
  if (fieldName.startsWith("$variable[")) {
    return true;
  }
  const field = getField(command, fieldName, scriptEventDefsLookup);
  const argValue = args[fieldName];
  return (
    !!field &&
    (field.type === "variable" || isUnionVariableValue(argValue)) &&
    isFieldVisible(field, args)
  );
};

export const isActorField = (
  cmd: string,
  fieldName: string,
  args: ScriptEventArgs,
  scriptEventDefsLookup: ScriptEventDefsLookup
) => {
  const field = getField(cmd, fieldName, scriptEventDefsLookup);
  return !!field && field.type === "actor" && isFieldVisible(field, args);
};

export const isPropertyField = (
  cmd: string,
  fieldName: string,
  args: ScriptEventArgs,
  scriptEventDefsLookup: ScriptEventDefsLookup
) => {
  const event = scriptEventDefsLookup[cmd];
  if (!event) return false;
  const field = getField(cmd, fieldName, scriptEventDefsLookup);
  const fieldValue = args[fieldName];
  return (
    !!field &&
    (field.type === "property" || isUnionPropertyValue(fieldValue)) &&
    isFieldVisible(field, args)
  );
};
