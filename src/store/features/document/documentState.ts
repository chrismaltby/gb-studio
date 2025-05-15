import { createSlice, UnknownAction } from "@reduxjs/toolkit";
import projectActions, {
  SaveStep,
} from "store/features/project/projectActions";

export interface DocumentState {
  modified: boolean;
  loaded: boolean;
  saving: boolean;
  saveStep: SaveStep;
  saveWriteProgress: {
    completed: number;
    total: number;
  };
  saveError: boolean;
}

export const initialState: DocumentState = {
  modified: false,
  loaded: false,
  saving: false,
  saveStep: "complete",
  saveWriteProgress: {
    completed: 0,
    total: 0,
  },
  saveError: false,
};

const documentSlice = createSlice({
  name: "document",
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(projectActions.loadProject.pending, (state, _action) => {
        state.loaded = false;
      })
      .addCase(projectActions.loadProject.fulfilled, (state, action) => {
        state.modified = action.payload.isMigrated;
        state.loaded = true;
      })
      .addCase(projectActions.saveProject.pending, (state, _action) => {
        if (!state.saving) {
          state.saving = true;
          state.saveStep = "saving";
          state.saveError = false;
        }
      })
      .addCase(projectActions.saveProject.rejected, (state, _action) => {
        state.saving = false;
        if (state.saveStep !== "saving") {
          state.saveError = true;
        }
      })
      .addCase(projectActions.saveProject.fulfilled, (state, _action) => {
        state.saving = false;
        state.modified = false;
        state.saveStep = "complete";
        state.saveError = false;
      })
      .addCase(projectActions.setSaveStep, (state, action) => {
        state.saveStep = action.payload;
      })
      .addCase(projectActions.setSaveWriteProgress, (state, action) => {
        state.saveWriteProgress = action.payload;
      })
      .addMatcher(
        (action: UnknownAction): action is UnknownAction =>
          action.type.startsWith("entities/") ||
          action.type.startsWith("metadata/") ||
          action.type.startsWith("settings/") ||
          action.type.startsWith("sprite/detect/fulfilled"),
        (state, _action) => {
          state.modified = true;
        }
      ),
});

const { reducer } = documentSlice;

export default reducer;
