import { createSelector, createSlice, Dictionary } from "@reduxjs/toolkit";
import type { ScriptEventDef } from "lib/project/loadScriptEvents";
import { RootState } from "store/configureStore";
import projectActions from "store/features/project/projectActions";

export interface ScriptEventsState {
  eventsLookup: Dictionary<ScriptEventDef>;
  engineFieldUpdateEventsLookup: Dictionary<ScriptEventDef>;
  engineFieldStoreEventsLookup: Dictionary<ScriptEventDef>;
  loaded: boolean;
}

export const initialState: ScriptEventsState = {
  eventsLookup: {},
  engineFieldUpdateEventsLookup: {},
  engineFieldStoreEventsLookup: {},
  loaded: false,
};

const scriptEventDefsSlice = createSlice({
  name: "scriptEventDefs",
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(projectActions.loadProject.pending, (state, _action) => {
        state.loaded = false;
      })
      .addCase(projectActions.loadProject.fulfilled, (state, action) => {
        state.eventsLookup = action.payload.scriptEventDefs;
        state.loaded = true;
      }),
});

const { reducer } = scriptEventDefsSlice;

export const selectScriptEventDefsLookup = (state: RootState) =>
  state.scriptEventDefs.eventsLookup;

export const selectEngineFieldUpdateEventDefsLookup = (state: RootState) =>
  state.scriptEventDefs.engineFieldUpdateEventsLookup;

export const selectEngineFieldStoreEventDefsLookup = (state: RootState) =>
  state.scriptEventDefs.engineFieldStoreEventsLookup;

export const selectScriptEventDefsLookups = createSelector(
  [
    selectScriptEventDefsLookup,
    selectEngineFieldUpdateEventDefsLookup,
    selectEngineFieldStoreEventDefsLookup,
  ],
  (
    eventsLookup,
    engineFieldUpdateEventsLookup,
    engineFieldStoreEventsLookup
  ) => ({
    eventsLookup,
    engineFieldUpdateEventsLookup,
    engineFieldStoreEventsLookup,
  })
);

export default reducer;
