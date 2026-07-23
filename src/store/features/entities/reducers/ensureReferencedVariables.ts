import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import {
  genEntitySymbol,
  isUnionValue,
} from "shared/lib/entities/entitiesHelpers";
import {
  ScriptEventDefs,
  isScriptValueField,
  isVariableField,
} from "shared/lib/scripts/scriptDefHelpers";
import { extractScriptValueVariables } from "shared/lib/scriptValue/helpers";
import { isScriptValue } from "shared/lib/scriptValue/types";
import { lexText } from "shared/lib/compiler/lexText";
import tokenizer from "shared/lib/rpn/tokenizer";
import {
  globalVariableDefaultName,
  isGlobalVariableId,
} from "shared/lib/variables/variableNames";
import { variablesAdapter } from "store/features/entities/adapters";

// Global variables referenced by scripts but not yet defined in the
// variables collection get an entity created for them so they are visible
// in the variables navigator and are always included in builds. Projects
// created before variables were managed explicitly only stored entities
// for variables that had been renamed.
export const ensureReferencedVariablesExist = (
  state: EntitiesState,
  scriptEventDefs: ScriptEventDefs,
) => {
  const referenced = new Set<string>();

  const addVariableId = (value: unknown) => {
    // Only purely numeric ids are global variables ("L0"/"T0"/"V0" are
    // local/temp/custom script variables). Dialogue ids may be zero padded.
    if (typeof value !== "string" || !isGlobalVariableId(value)) {
      return;
    }
    referenced.add(String(Number(value)));
  };

  const addVariablesFromText = (value: unknown) => {
    const rows = Array.isArray(value) ? value : [value];
    for (const row of rows) {
      if (typeof row !== "string") {
        continue;
      }
      for (const token of lexText(row)) {
        if ("variableId" in token) {
          addVariableId(token.variableId);
        }
      }
    }
  };

  for (const scriptEvent of Object.values(state.scriptEvents.entities)) {
    const args = scriptEvent?.args;
    if (!scriptEvent || !args) {
      continue;
    }
    const command = scriptEvent.command;

    const references = args.references;
    if (Array.isArray(references)) {
      for (const reference of references) {
        if (
          reference &&
          typeof reference === "object" &&
          (reference as { type?: string }).type === "variable"
        ) {
          addVariableId((reference as { id?: string }).id);
        }
      }
    }

    for (const arg in args) {
      const argValue = args[arg];
      // Custom script call arguments ("$variable[V0]$") hold a variable id
      // directly and have no field definition
      if (arg.startsWith("$variable[")) {
        if (isUnionValue(argValue)) {
          if (argValue.type === "variable") {
            addVariableId(argValue.value);
          }
        } else {
          addVariableId(argValue);
        }
        continue;
      }
      const field = scriptEventDefs[command]?.fieldsLookup?.[arg];
      if (!field) {
        continue;
      }
      if (isScriptValueField(command, arg, args, scriptEventDefs)) {
        if (isScriptValue(argValue)) {
          extractScriptValueVariables(argValue).forEach(addVariableId);
        }
      } else if (isVariableField(command, arg, args, scriptEventDefs)) {
        if (isUnionValue(argValue)) {
          if (argValue.type === "variable") {
            addVariableId(argValue.value);
          }
        } else {
          addVariableId(argValue);
        }
      } else if (field.type === "text" || field.type === "textarea") {
        addVariablesFromText(argValue);
      } else if (field.type === "matharea" && typeof argValue === "string") {
        for (const token of tokenizer(argValue)) {
          if (token.type === "VAR") {
            addVariableId(token.symbol.replace(/\$/g, ""));
          }
        }
      }
    }
  }

  const missingIds = Array.from(referenced)
    .filter((id) => !state.variables.entities[id])
    .sort((a, b) => Number(a) - Number(b));

  for (const id of missingIds) {
    variablesAdapter.addOne(state.variables, {
      id,
      name: "",
      symbol: genEntitySymbol(state, `var_${globalVariableDefaultName(id)}`),
    });
  }
};
