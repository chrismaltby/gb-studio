import { createSlice, Dictionary } from "@reduxjs/toolkit";
import type { ScriptEventDef } from "lib/project/loadScriptEvents";
import { RootState } from "store/configureStore";
import projectActions from "store/features/project/projectActions";

export interface ScriptEventsState {
  eventsLookup: Dictionary<ScriptEventDef>;
  loaded: boolean;
}

export const initialState: ScriptEventsState = {
  eventsLookup: {},
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

export default reducer;
