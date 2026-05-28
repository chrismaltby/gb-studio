import {
  ConstScriptValue,
  isConstScriptValue,
} from "shared/lib/scriptValue/types";

export type ScriptDataTableRow = {
  label?: string;
  values: (ConstScriptValue | undefined)[];
};

export type ScriptDataTable = {
  label?: string;
  variables: string[];
  rows: ScriptDataTableRow[];
};

const isScriptDataTableRow = (obj: unknown): obj is ScriptDataTableRow => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    (!("label" in obj) ||
      typeof (obj as { label: unknown }).label === "string" ||
      typeof (obj as { label: unknown }).label === "undefined") &&
    "values" in obj &&
    Array.isArray((obj as { values: unknown }).values) &&
    (obj as { values: unknown[] }).values.every(
      (v: unknown) => isConstScriptValue(v) || v === undefined,
    )
  );
};

export const isScriptDataTable = (obj: unknown): obj is ScriptDataTable => {
  return (
    typeof obj === "object" &&
    obj !== null &&
    (!("label" in obj) ||
      typeof (obj as { label: unknown }).label === "string" ||
      typeof (obj as { label: unknown }).label === "undefined") &&
    "variables" in obj &&
    Array.isArray((obj as { variables: unknown }).variables) &&
    (obj as { variables: unknown[] }).variables.every(
      (v: unknown) => typeof v === "string",
    ) &&
    "rows" in obj &&
    Array.isArray((obj as { rows: unknown }).rows) &&
    (obj as { rows: unknown[] }).rows.every(isScriptDataTableRow)
  );
};
