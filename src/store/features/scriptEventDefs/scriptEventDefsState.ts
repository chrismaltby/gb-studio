import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ScriptEventDefs } from "shared/lib/scripts/scriptDefHelpers";
import { RootState } from "store/configureStore";
import projectActions from "store/features/project/projectActions";

export interface ScriptEventsState {
  lookup: ScriptEventDefs;
  loaded: boolean;
}

export const initialState: ScriptEventsState = {
  lookup: {},
  loaded: false,
};

const scriptEventDefsSlice = createSlice({
  name: "scriptEventDefs",
  initialState,
  reducers: {
    setScriptEventDefs: (state, action: PayloadAction<ScriptEventDefs>) => {
      state.lookup = action.payload;
      state.loaded = true;
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(projectActions.loadProject.pending, (state, _action) => {
        state.loaded = false;
      })
      .addCase(projectActions.loadProject.fulfilled, (state, action) => {
        state.lookup = action.payload.scriptEventDefs;
        state.loaded = true;
      }),
});

export const selectScriptEventDefs = (state: RootState) =>
  state.scriptEventDefs.lookup;

export const { actions, reducer } = scriptEventDefsSlice;

export default reducer;
