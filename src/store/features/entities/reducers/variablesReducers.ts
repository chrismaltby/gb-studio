import {
  PayloadAction,
  CaseReducer,
  SliceCaseReducers,
} from "@reduxjs/toolkit";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import {
  applyReparentEntityToCollection,
  applyReparentFolderToCollection,
  genEntitySymbol,
} from "shared/lib/entities/entitiesHelpers";
import { variablesAdapter } from "store/features/entities/adapters";
import { v4 as uuid } from "uuid";
import { localVariableSelectTotal } from "store/features/entities/helpers";
import { Variable, VariableType } from "shared/lib/resources/types";

const addVariable: CaseReducer<
  EntitiesState,
  PayloadAction<{
    variableId: string;
  }>
> = (state, action) => {
  const numVariables = localVariableSelectTotal(state);

  const newVariable: Variable = {
    id: action.payload.variableId,
    name: "",
    symbol: genEntitySymbol(state, `var_${numVariables + 1}`),
    type: "number",
  };

  variablesAdapter.addOne(state.variables, newVariable);
};

const setVariableType: CaseReducer<
  EntitiesState,
  PayloadAction<{ variableId: string; type: VariableType }>
> = (state, action) => {
  const existingVariable = state.variables.entities[action.payload.variableId];
  if (!existingVariable) {
    return;
  }
  const baseVariable = {
    id: existingVariable.id,
    name: existingVariable.name,
    symbol: existingVariable.symbol,
    flags: existingVariable.flags,
  };
  const updatedVariable: Variable =
    action.payload.type === "array"
      ? {
          ...baseVariable,
          type: "array",
          size:
            existingVariable.type === "array"
              ? Math.max(1, Math.floor(existingVariable.size))
              : 1,
        }
      : {
          ...baseVariable,
          type: "number",
        };
  variablesAdapter.setOne(state.variables, updatedVariable);
};

const setVariableSize: CaseReducer<
  EntitiesState,
  PayloadAction<{ variableId: string; size: number }>
> = (state, action) => {
  const existingVariable = state.variables.entities[action.payload.variableId];
  if (!existingVariable || existingVariable.type !== "array") {
    return;
  }
  variablesAdapter.updateOne(state.variables, {
    id: action.payload.variableId,
    changes: {
      size: Math.max(1, Math.floor(action.payload.size || 1)),
    },
  });
};

const renameVariable: CaseReducer<
  EntitiesState,
  PayloadAction<{ variableId: string; name: string }>
> = (state, action) => {
  const existingVariable = state.variables.entities[action.payload.variableId];
  if (existingVariable) {
    variablesAdapter.updateOne(state.variables, {
      id: action.payload.variableId,
      changes: {
        name: action.payload.name,
        symbol:
          action.payload.name.length > 0
            ? genEntitySymbol(state, `var_${action.payload.name}`)
            : existingVariable.symbol,
      },
    });
  } else if (action.payload.name.length > 0) {
    variablesAdapter.addOne(state.variables, {
      id: action.payload.variableId,
      name: action.payload.name,
      symbol: genEntitySymbol(state, `var_${action.payload.name}`),
      type: "number",
    });
  }
};

const renameVariableFlags: CaseReducer<
  EntitiesState,
  PayloadAction<{ variableId: string; flags: Record<string, string> }>
> = (state, action) => {
  const existingVariable = state.variables.entities[action.payload.variableId];
  const numFlags = Object.values(action.payload.flags).length;
  if (existingVariable) {
    variablesAdapter.updateOne(state.variables, {
      id: action.payload.variableId,
      changes: {
        flags: action.payload.flags,
      },
    });
  } else if (numFlags > 0) {
    variablesAdapter.addOne(state.variables, {
      id: action.payload.variableId,
      name: "",
      symbol: "",
      type: "number",
      flags: action.payload.flags,
    });
  }
};

const reparentVariablesFolder: CaseReducer<
  EntitiesState,
  PayloadAction<{
    fromPath: string;
    toPath: string;
  }>
> = (state, action) => {
  applyReparentFolderToCollection(
    state.variables.entities,
    action.payload.fromPath,
    action.payload.toPath,
  );
};

const reparentVariable: CaseReducer<
  EntitiesState,
  PayloadAction<{
    constantId: string;
    toPath: string;
  }>
> = (state, action) => {
  applyReparentEntityToCollection(
    state.variables.entities,
    action.payload.constantId,
    action.payload.toPath,
  );
};

const variablesReducers = {
  addVariable: {
    reducer: addVariable,
    prepare: () => {
      return {
        payload: {
          variableId: uuid(),
        },
      };
    },
  },

  renameVariable,
  renameVariableFlags,
  setVariableType,
  setVariableSize,
  reparentVariablesFolder,
  reparentVariable,
} satisfies SliceCaseReducers<EntitiesState>;

export default variablesReducers;
