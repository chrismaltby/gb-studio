import type { ScriptEventFieldSchema } from "shared/lib/entities/entitiesTypes";
import type { ScriptEventDefs } from "shared/lib/scripts/scriptDefHelpers";
import type { ScriptEventDefsForVariableExtraction } from "shared/lib/variables/extractVariableReferences";

export type ScriptEventDefsSnapshot = Record<string, Record<string, string>>;

const snapshotScriptEventFields = (
  fields: ScriptEventFieldSchema[],
  fieldTypes?: ReadonlySet<string>,
  fieldsSnapshot: Record<string, string> = {},
): Record<string, string> => {
  for (const field of fields) {
    if (field.type === "group" && field.fields) {
      snapshotScriptEventFields(field.fields, fieldTypes, fieldsSnapshot);
    } else if (
      field.key &&
      field.type &&
      (!fieldTypes || fieldTypes.has(field.type))
    ) {
      fieldsSnapshot[field.key] = field.type;
    }
  }
  return fieldsSnapshot;
};

export const scriptEventDefsToSnapshot = (
  scriptEventDefs: ScriptEventDefs,
  fieldTypes?: readonly string[],
): ScriptEventDefsSnapshot => {
  const selectedFieldTypes =
    fieldTypes && fieldTypes.length > 0 ? new Set(fieldTypes) : undefined;
  const snapshot: ScriptEventDefsSnapshot = {};

  for (const id of Object.keys(scriptEventDefs).sort()) {
    const fieldsSnapshot = snapshotScriptEventFields(
      scriptEventDefs[id]?.fields ?? [],
      selectedFieldTypes,
    );
    if (!selectedFieldTypes || Object.keys(fieldsSnapshot).length > 0) {
      snapshot[id] = fieldsSnapshot;
    }
  }

  return snapshot;
};

export const scriptEventDefsFromSnapshot = (
  snapshot: ScriptEventDefsSnapshot,
): ScriptEventDefsForVariableExtraction => {
  const scriptEventDefs: ScriptEventDefsForVariableExtraction = {};

  for (const [id, fields] of Object.entries(snapshot)) {
    scriptEventDefs[id] = {
      fieldsLookup: Object.fromEntries(
        Object.entries(fields).map(([key, type]) => [key, { type }]),
      ),
    };
  }

  return scriptEventDefs;
};
