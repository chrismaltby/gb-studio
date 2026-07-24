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
import { Variable } from "shared/lib/resources/types";

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
  };

  variablesAdapter.addOne(state.variables, newVariable);
};

const renameVariable: CaseReducer<
  EntitiesState,
  PayloadAction<{ variableId: string; name: string }>
> = (state, action) => {
  const existingVariable = state.variables.entities[action.payload.variableId];
  const existingHasFlags =
    existingVariable?.flags && Object.keys(existingVariable.flags).length > 0;
  if (action.payload.name.length > 0 || existingHasFlags) {
    variablesAdapter.upsertOne(state.variables, {
      id: action.payload.variableId,
      name: action.payload.name,
      symbol:
        action.payload.name.length > 0
          ? genEntitySymbol(state, `var_${action.payload.name}`)
          : "",
    });
  } else {
    // Variable is being set with empty name and doesn't have flags
    // set so can safely remove it
    variablesAdapter.removeOne(state.variables, action.payload.variableId);
  }
};

const renameVariableFlags: CaseReducer<
  EntitiesState,
  PayloadAction<{ variableId: string; flags: Record<string, string> }>
> = (state, action) => {
  const existingVariable = state.variables.entities[action.payload.variableId];
  const numFlags = Object.values(action.payload.flags).length;
  const existingHasName =
    existingVariable?.name && existingVariable?.name.length > 0;
  if (numFlags > 0 || existingHasName) {
    variablesAdapter.upsertOne(state.variables, {
      id: action.payload.variableId,
      name: existingVariable?.name ?? "",
      symbol: existingVariable?.symbol ?? "",
      flags: action.payload.flags,
    });
  } else {
    // Variable is being set with empty flags and doesn't have name
    // set so can safely remove it
    variablesAdapter.removeOne(state.variables, action.payload.variableId);
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
  reparentVariablesFolder,
  reparentVariable,
} satisfies SliceCaseReducers<EntitiesState>;

export default variablesReducers;
