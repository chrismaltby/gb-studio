import type { ScriptEvent } from "shared/lib/resources/types";
import type { ScriptEventDefs } from "shared/lib/scripts/scriptDefHelpers";
import { lexText } from "shared/lib/compiler/lexText";
import tokenizer from "shared/lib/rpn/tokenizer";
import { isScriptDataTable } from "shared/lib/scriptDataTable/types";
import { extractScriptValueVariables } from "shared/lib/scriptValue/helpers";
import {
  isIndexedVariable,
  isScriptValue,
} from "shared/lib/scriptValue/types";

const normalizeVariableId = (variableId: string): string => {
  if (/^\d+$/.test(variableId)) {
    return String(Number(variableId));
  }
  return variableId;
};

const isUnionVariableValue = (
  value: unknown,
): value is { type: "variable"; value?: string } => {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "variable" &&
    (!("value" in value) ||
      value.value === undefined ||
      typeof value.value === "string")
  );
};

const extractDialogueVariableIds = (value: unknown): string[] => {
  const textValues = Array.isArray(value) ? value : [value];
  const variableIds: string[] = [];

  for (const textValue of textValues) {
    if (typeof textValue !== "string") {
      continue;
    }
    for (const token of lexText(textValue)) {
      if ("variableId" in token) {
        variableIds.push(token.variableId);
      }
    }
  }

  return variableIds;
};

const extractExpressionVariableIds = (value: unknown): string[] => {
  if (typeof value !== "string") {
    return [];
  }

  try {
    return tokenizer(value)
      .filter((token) => token.type === "VAR")
      .flatMap((token) => [
        token.symbol.replaceAll("$", ""),
        ...(token.index?.type === "VAR"
          ? [token.index.symbol.replaceAll("$", "")]
          : []),
      ]);
  } catch {
    return [];
  }
};

const extractReferencedVariableIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((reference) => {
    if (
      typeof reference === "object" &&
      reference !== null &&
      "type" in reference &&
      reference.type === "variable" &&
      "id" in reference &&
      typeof reference.id === "string"
    ) {
      return [reference.id];
    }
    return [];
  });
};

export const extractVariableIdsFromScriptEvent = (
  scriptEvent: Pick<ScriptEvent, "id" | "command" | "args">,
  scriptEventDefs: ScriptEventDefs,
): string[] => {
  const variableIds = new Set<string>();
  const args = scriptEvent.args;
  if (!args) {
    return [];
  }

  const addVariableId = (variableId: string | undefined) => {
    if (variableId) {
      variableIds.add(normalizeVariableId(variableId));
    }
  };

  for (const [key, value] of Object.entries(args)) {
    const field = scriptEventDefs[scriptEvent.command]?.fieldsLookup[key];
    const isCustomEventVariableArg = key.startsWith("$variable[");

    if (field?.type === "variable" || (field && isUnionVariableValue(value))) {
      if (typeof value === "string") {
        addVariableId(value);
      } else if (isIndexedVariable(value)) {
        addVariableId(value.value);
        if (value.index.type === "variable") {
          addVariableId(value.index.value);
        }
      } else if (isUnionVariableValue(value)) {
        addVariableId(value.value);
      }
    }

    if (field?.type === "value" || isCustomEventVariableArg) {
      if (isScriptValue(value)) {
        extractScriptValueVariables(value).forEach(addVariableId);
      }
    }

    if (field?.type === "text" || field?.type === "textarea") {
      extractDialogueVariableIds(value).forEach(addVariableId);
    }

    if (field?.type === "matharea") {
      extractExpressionVariableIds(value).forEach(addVariableId);
    }

    if (field?.type === "dataTable" && isScriptDataTable(value)) {
      value.variables.forEach(addVariableId);
    }

    if (field?.type === "references") {
      extractReferencedVariableIds(value).forEach(addVariableId);
    }
  }

  return Array.from(variableIds);
};
