import {
  PayloadAction,
  CaseReducer,
  SliceCaseReducers,
} from "@reduxjs/toolkit";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import {
  genEntitySymbol,
  applyReparentFolderToCollection,
  applyReparentEntityToCollection,
} from "shared/lib/entities/entitiesHelpers";
import { Constant } from "shared/lib/resources/types";
import { constantsAdapter } from "store/features/entities/adapters";
import {
  localConstantSelectTotal,
  localConstantSelectById,
} from "store/features/entities/helpers";
import { v4 as uuid } from "uuid";

const addConstant: CaseReducer<
  EntitiesState,
  PayloadAction<{
    constantId: string;
  }>
> = (state, action) => {
  const numConstants = localConstantSelectTotal(state);

  const newConstant: Constant = {
    id: action.payload.constantId,
    name: "",
    symbol: genEntitySymbol(state, `const_constant_${numConstants + 1}`),
    value: 0,
  };

  constantsAdapter.addOne(state.constants, newConstant);
};

const editConstant: CaseReducer<
  EntitiesState,
  PayloadAction<{
    constantId: string;
    changes: Partial<Constant>;
  }>
> = (state, action) => {
  const constant = localConstantSelectById(state, action.payload.constantId);

  if (!constant) {
    return;
  }

  const patch = {
    ...action.payload.changes,
    symbol: action.payload.changes.name
      ? genEntitySymbol(state, `const_${action.payload.changes.name ?? "0"}`)
      : constant.symbol,
  };

  constantsAdapter.updateOne(state.constants, {
    id: action.payload.constantId,
    changes: patch,
  });
};

const renameConstant: CaseReducer<
  EntitiesState,
  PayloadAction<{ constantId: string; name: string }>
> = (state, action) => {
  const constant = localConstantSelectById(state, action.payload.constantId);
  const patch = {
    name: action.payload.name,
    symbol: genEntitySymbol(state, `const_${action.payload.name ?? "0"}`),
  };

  if (!constant) {
    return;
  }

  constantsAdapter.updateOne(state.constants, {
    id: action.payload.constantId,
    changes: patch,
  });
};

const removeConstant: CaseReducer<
  EntitiesState,
  PayloadAction<{
    constantId: string;
  }>
> = (state, action) => {
  constantsAdapter.removeOne(state.constants, action.payload.constantId);
};

const reparentConstantsFolder: CaseReducer<
  EntitiesState,
  PayloadAction<{
    fromPath: string;
    toPath: string;
  }>
> = (state, action) => {
  applyReparentFolderToCollection(
    state.constants.entities,
    action.payload.fromPath,
    action.payload.toPath,
  );
};

const reparentConstant: CaseReducer<
  EntitiesState,
  PayloadAction<{
    constantId: string;
    toPath: string;
  }>
> = (state, action) => {
  applyReparentEntityToCollection(
    state.constants.entities,
    action.payload.constantId,
    action.payload.toPath,
  );
};

const constantsReducers = {
  addConstant: {
    reducer: addConstant,
    prepare: () => {
      return {
        payload: {
          constantId: uuid(),
        },
      };
    },
  },

  editConstant,
  renameConstant,
  removeConstant,
  reparentConstantsFolder,
  reparentConstant,
} satisfies SliceCaseReducers<EntitiesState>;

export default constantsReducers;
