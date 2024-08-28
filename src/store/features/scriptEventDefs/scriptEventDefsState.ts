import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ScriptEventDefs } from "shared/lib/scripts/scriptDefHelpers";
import { RootState } from "store/configureStore";
import projectActions from "store/features/project/projectActions";

export interface ScriptEventsState {
  lookup: ScriptEventDefs;
  lookupWithPresets: ScriptEventDefs;
  loaded: boolean;
}

export const initialState: ScriptEventsState = {
  lookup: {},
  lookupWithPresets: {},
  loaded: false,
};

// Script Events Defs can optionally include a number of preset values
// this function creates a lookup containing all the script event defs
// and also an entry for every one of their presets. Allowing components like
// AddScriptEventMenu to require very little about the concept of presets
const buildPresets = (lookup: ScriptEventDefs): ScriptEventDefs => {
  return Object.values(lookup).reduce(
    (memo, def) => {
      if (def && def.presets) {
        def.presets.forEach((p) => {
          memo[`${def.id}::${p.id}`] = {
            ...def,
            id: `${def.id}::${p.id}`,
            name: p.name,
            description: p.description ?? def.description,
            groups: p.groups ?? def.groups,
            subGroups: p.subGroups ?? def.subGroups,
          };
        });
      }
      return memo;
    },
    { ...lookup }
  );
};

const scriptEventDefsSlice = createSlice({
  name: "scriptEventDefs",
  initialState,
  reducers: {
    setScriptEventDefs: (state, action: PayloadAction<ScriptEventDefs>) => {
      state.lookup = action.payload;
      state.lookupWithPresets = buildPresets(state.lookup);
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
        state.lookupWithPresets = buildPresets(state.lookup);
        state.loaded = true;
      }),
});

export const selectScriptEventDefs = (state: RootState) =>
  state.scriptEventDefs.lookup;

export const selectScriptEventDefsWithPresets = (state: RootState) =>
  state.scriptEventDefs.lookupWithPresets;

export const { actions, reducer } = scriptEventDefsSlice;

export default reducer;
