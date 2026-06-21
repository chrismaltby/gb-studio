import {
  PayloadAction,
  CaseReducer,
  SliceCaseReducers,
} from "@reduxjs/toolkit";
import { EntitiesState } from "shared/lib/entities/entitiesTypes";
import { engineFieldValuesAdapter } from "store/features/entities/adapters";

const editEngineFieldValue: CaseReducer<
  EntitiesState,
  PayloadAction<{
    engineFieldId: string;
    value: string | number | undefined;
  }>
> = (state, action) => {
  engineFieldValuesAdapter.upsertOne(state.engineFieldValues, {
    id: action.payload.engineFieldId,
    value: action.payload.value,
  });
};

const removeEngineFieldValue: CaseReducer<
  EntitiesState,
  PayloadAction<{ engineFieldId: string }>
> = (state, action) => {
  engineFieldValuesAdapter.removeOne(
    state.engineFieldValues,
    action.payload.engineFieldId,
  );
};

const engineFieldValuesReducers = {
  editEngineFieldValue,
  removeEngineFieldValue,
} satisfies SliceCaseReducers<EntitiesState>;

export default engineFieldValuesReducers;
