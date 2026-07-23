import {
  PayloadAction,
  CaseReducer,
  SliceCaseReducers,
} from "@reduxjs/toolkit";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import { genEntitySymbol } from "shared/lib/entities/entitiesHelpers";
import {
  getBaseName,
  getParentPath,
  joinPath,
  canMoveFolder,
  reparentFolderPath,
  reparentEntityPath,
} from "shared/lib/helpers/virtualFilesystem";
import {
  globalVariableDefaultName,
  isGlobalVariableId,
} from "shared/lib/variables/variableNames";
import type { ScriptEventDefs } from "shared/lib/scripts/scriptDefHelpers";
import {
  matchesArrayName,
  renameArrayInExpressionText,
} from "shared/lib/rpn/arrays";
import { renameArrayInScriptValue } from "shared/lib/scriptValue/helpers";
import { isScriptValue } from "shared/lib/scriptValue/types";
import { Variable } from "shared/lib/resources/types";
import { variablesAdapter } from "store/features/entities/adapters";

const localVariableSelectById = (state: EntitiesState, id: string) =>
  state.variables.entities[id];

const defaultVariableSymbol = (state: EntitiesState, variable: Variable) => {
  const displayName =
    getBaseName(variable.name) || globalVariableDefaultName(variable.id);
  return genEntitySymbol(state, `var_${displayName}`);
};

// Global variable order in the ids array determines runtime allocation order.
// Keep entities within the same folder contiguous (with nested folders
// nesting inside their parent's block) so the navigator tree renders each
// folder as one block and folder members get contiguous runtime indices.
const regroupVariableIds = (state: EntitiesState) => {
  type FolderNode = {
    children: (string | FolderNode)[];
  };
  const root: FolderNode = { children: [] };
  const folders = new Map<string, FolderNode>([["", root]]);
  const getFolder = (path: string): FolderNode => {
    const existing = folders.get(path);
    if (existing) {
      return existing;
    }
    const node: FolderNode = { children: [] };
    folders.set(path, node);
    getFolder(getParentPath(path)).children.push(node);
    return node;
  };
  const nonGlobalIds: string[] = [];
  for (const id of state.variables.ids as string[]) {
    if (!isGlobalVariableId(id)) {
      // Local variable name entities have no meaningful order
      nonGlobalIds.push(id);
      continue;
    }
    const name = state.variables.entities[id]?.name ?? "";
    getFolder(getParentPath(name)).children.push(id);
  }
  const flattened: string[] = [];
  const flatten = (node: FolderNode) => {
    for (const child of node.children) {
      if (typeof child === "string") {
        flattened.push(child);
      } else {
        flatten(child);
      }
    }
  };
  flatten(root);
  state.variables.ids = flattened.concat(nonGlobalIds);
};

const addVariable: CaseReducer<
  EntitiesState,
  PayloadAction<{ variableId: string; name?: string; skipSelection?: boolean }>
> = (state, action) => {
  const { variableId, name } = action.payload;
  if (
    !isGlobalVariableId(variableId) ||
    localVariableSelectById(state, variableId)
  ) {
    return;
  }
  const newVariable: Variable = {
    id: variableId,
    name: name ?? "",
    symbol: "",
  };
  newVariable.symbol = defaultVariableSymbol(state, newVariable);
  variablesAdapter.addOne(state.variables, newVariable);
  regroupVariableIds(state);
};

const addVariableArray: CaseReducer<
  EntitiesState,
  PayloadAction<{ variableIds: string[]; name: string }>
> = (state, action) => {
  const { variableIds, name } = action.payload;
  const folderPath = name.trim();
  if (!folderPath) {
    return;
  }
  const baseName = getBaseName(folderPath);
  const newVariables: Variable[] = [];
  variableIds.forEach((variableId, index) => {
    if (
      !isGlobalVariableId(variableId) ||
      localVariableSelectById(state, variableId)
    ) {
      return;
    }
    const variable: Variable = {
      id: variableId,
      name: joinPath(folderPath, `${baseName} ${index}`),
      symbol: "",
    };
    variable.symbol = genEntitySymbol(state, `var_${baseName}_${index}`);
    newVariables.push(variable);
  });
  variablesAdapter.addMany(state.variables, newVariables);
  regroupVariableIds(state);
};

const removeVariable: CaseReducer<
  EntitiesState,
  PayloadAction<{ variableId: string }>
> = (state, action) => {
  variablesAdapter.removeOne(state.variables, action.payload.variableId);
};

const renameVariable: CaseReducer<
  EntitiesState,
  PayloadAction<{ variableId: string; name: string }>
> = (state, action) => {
  const { variableId, name } = action.payload;
  const existingVariable = localVariableSelectById(state, variableId);
  const existingHasFlags =
    existingVariable?.flags && Object.keys(existingVariable.flags).length > 0;

  if (isGlobalVariableId(variableId) && existingVariable) {
    // Defined global variables are managed explicitly — clearing the name
    // keeps the variable (shown with its default name) rather than
    // removing it. Remove is available separately.
    const updatedVariable: Variable = {
      ...existingVariable,
      name,
    };
    variablesAdapter.upsertOne(state.variables, {
      ...updatedVariable,
      symbol: defaultVariableSymbol(state, updatedVariable),
    });
    regroupVariableIds(state);
    return;
  }

  if (name.length > 0 || existingHasFlags) {
    variablesAdapter.upsertOne(state.variables, {
      id: variableId,
      name,
      symbol:
        name.length > 0 ? genEntitySymbol(state, `var_${getBaseName(name)}`) : "",
    });
    if (isGlobalVariableId(variableId)) {
      regroupVariableIds(state);
    }
  } else {
    // Variable is being set with empty name and doesn't have flags
    // set so can safely remove it
    variablesAdapter.removeOne(state.variables, variableId);
  }
};

const renameVariableFlags: CaseReducer<
  EntitiesState,
  PayloadAction<{ variableId: string; flags: Record<string, string> }>
> = (state, action) => {
  const { variableId, flags } = action.payload;
  const existingVariable = localVariableSelectById(state, variableId);
  const numFlags = Object.values(flags).length;
  const existingHasName =
    existingVariable?.name && existingVariable?.name.length > 0;
  if (
    numFlags > 0 ||
    existingHasName ||
    (isGlobalVariableId(variableId) && existingVariable)
  ) {
    variablesAdapter.upsertOne(state.variables, {
      id: variableId,
      name: existingVariable?.name ?? "",
      symbol: existingVariable?.symbol ?? "",
      flags,
    });
  } else {
    // Variable is being set with empty flags and doesn't have name
    // set so can safely remove it
    variablesAdapter.removeOne(state.variables, variableId);
  }
};

const reparentVariable: CaseReducer<
  EntitiesState,
  PayloadAction<{ variableId: string; toPath: string }>
> = (state, action) => {
  const { variableId, toPath } = action.payload;
  const variable = localVariableSelectById(state, variableId);
  if (!variable || !isGlobalVariableId(variableId)) {
    return;
  }
  variable.name = reparentEntityPath(variable.name, toPath);
  regroupVariableIds(state);
};

const reparentVariablesFolder: CaseReducer<
  EntitiesState,
  PayloadAction<{
    fromPath: string;
    toPath: string;
    scriptEventDefs?: ScriptEventDefs;
  }>
> = (state, action) => {
  const { fromPath, toPath } = action.payload;
  if (!canMoveFolder(fromPath, toPath)) {
    return;
  }
  for (const id of state.variables.ids as string[]) {
    if (!isGlobalVariableId(id)) {
      continue;
    }
    const variable = state.variables.entities[id];
    if (!variable) {
      continue;
    }
    const newPath = reparentFolderPath(variable.name, fromPath, toPath);
    if (newPath) {
      variable.name = newPath;
    }
  }
  regroupVariableIds(state);
  const newFolderPath = joinPath(toPath, getBaseName(fromPath));
  if (newFolderPath !== fromPath) {
    renameArrayReferencesInScripts(
      state,
      fromPath,
      newFolderPath,
      action.payload.scriptEventDefs,
    );
  }
};

// Update script references to a variable array (folder of global
// variables) after the folder's path has changed — the array dropdown of
// events, arrayValue nodes within script values, and array accesses within
// expression texts. Field types are resolved via scriptEventDefs when
// provided — script values are detected by shape so they update either way
const renameArrayReferencesInScripts = (
  state: EntitiesState,
  fromPath: string,
  toPath: string,
  scriptEventDefs?: ScriptEventDefs,
) => {
  const toBaseName = toPath.replace(/\\/g, "/").replace(/.*\//, "");
  for (const scriptEvent of Object.values(state.scriptEvents.entities)) {
    const args = scriptEvent?.args;
    if (!scriptEvent || !args) {
      continue;
    }
    for (const key in args) {
      const argValue = args[key];
      const fieldType =
        scriptEventDefs?.[scriptEvent.command]?.fieldsLookup?.[key]?.type;
      if (fieldType === "variableArray") {
        if (
          typeof argValue === "string" &&
          matchesArrayName(argValue, fromPath)
        ) {
          args[key] = toPath;
        }
      } else if (fieldType === "matharea") {
        if (typeof argValue === "string") {
          const newText = renameArrayInExpressionText(
            argValue,
            fromPath,
            toBaseName,
          );
          if (newText !== argValue) {
            args[key] = newText;
          }
        }
      } else if (isScriptValue(argValue)) {
        const newValue = renameArrayInScriptValue(argValue, fromPath, toPath);
        if (newValue !== argValue) {
          args[key] = newValue;
        }
      }
    }
  }
};

const renameVariablesFolder: CaseReducer<
  EntitiesState,
  PayloadAction<{
    fromPath: string;
    toPath: string;
    scriptEventDefs?: ScriptEventDefs;
  }>
> = (state, action) => {
  const fromPath = action.payload.fromPath.replace(/\\/g, "/");
  const toPath = action.payload.toPath.replace(/\\/g, "/");
  if (
    !fromPath ||
    !toPath ||
    fromPath === toPath ||
    toPath.startsWith(`${fromPath}/`)
  ) {
    return;
  }
  const prefix = `${fromPath}/`;
  for (const id of state.variables.ids as string[]) {
    if (!isGlobalVariableId(id)) {
      continue;
    }
    const variable = state.variables.entities[id];
    if (!variable) {
      continue;
    }
    const name = variable.name.replace(/\\/g, "/");
    if (name.startsWith(prefix)) {
      variable.name = `${toPath}/${name.slice(prefix.length)}`;
    }
  }
  regroupVariableIds(state);
  renameArrayReferencesInScripts(
    state,
    fromPath,
    toPath,
    action.payload.scriptEventDefs,
  );
};

const removeVariablesFolder: CaseReducer<
  EntitiesState,
  PayloadAction<{ path: string }>
> = (state, action) => {
  const path = action.payload.path.replace(/\\/g, "/");
  if (!path) {
    return;
  }
  const prefix = `${path}/`;
  const removeIds = (state.variables.ids as string[]).filter((id) => {
    if (!isGlobalVariableId(id)) {
      return false;
    }
    const name = state.variables.entities[id]?.name.replace(/\\/g, "/") ?? "";
    return name.startsWith(prefix);
  });
  variablesAdapter.removeMany(state.variables, removeIds);
};

const moveVariable: CaseReducer<
  EntitiesState,
  PayloadAction<{ variableId: string; direction: "up" | "down" }>
> = (state, action) => {
  const { variableId, direction } = action.payload;
  const variable = localVariableSelectById(state, variableId);
  if (!variable || !isGlobalVariableId(variableId)) {
    return;
  }
  const parentPath = getParentPath(variable.name);
  const ids = state.variables.ids as string[];
  // Siblings = global variables in the same folder, in current order
  const siblingIds = ids.filter((id) => {
    if (!isGlobalVariableId(id)) {
      return false;
    }
    const name = state.variables.entities[id]?.name ?? "";
    return getParentPath(name) === parentPath;
  });
  const siblingIndex = siblingIds.indexOf(variableId);
  const swapWithId =
    direction === "up"
      ? siblingIds[siblingIndex - 1]
      : siblingIds[siblingIndex + 1];
  if (swapWithId === undefined) {
    return;
  }
  const fromIndex = ids.indexOf(variableId);
  const toIndex = ids.indexOf(swapWithId);
  ids.splice(fromIndex, 1);
  ids.splice(toIndex, 0, variableId);
  regroupVariableIds(state);
};

const variablesReducers = {
  addVariable,
  addVariableArray,
  removeVariable,
  renameVariable,
  renameVariableFlags,
  reparentVariable,
  reparentVariablesFolder,
  renameVariablesFolder,
  removeVariablesFolder,
  moveVariable,
} satisfies SliceCaseReducers<EntitiesState>;

export default variablesReducers;
