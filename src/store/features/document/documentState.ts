import path from "path";
import { createSlice, AnyAction } from "@reduxjs/toolkit";
import projectActions from "../project/projectActions";

export interface DocumentState {
  modified: boolean;
  loaded: boolean;
  saving: boolean;
  path: string;
  root: string;
}

export const initialState: DocumentState = {
  modified: false,
  loaded: false,
  saving: false,
  path: "",
  root: "",
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
        state.path = action.payload.path;
        state.root = path.dirname(action.payload.path);
        state.modified = false;
        state.loaded = true;
      })
      .addCase(projectActions.saveProject.pending, (state, _action) => {
        state.saving = true;
      })
      .addCase(projectActions.saveProject.rejected, (state, _action) => {
        state.saving = false;
      })
      .addCase(projectActions.saveProject.fulfilled, (state, action) => {
        state.saving = false;
        state.modified = false;
        if (action.meta.arg) {
          // If "Save As" set new root path
          state.path = action.meta.arg;
          state.root = path.dirname(action.meta.arg);
        }
      })
      .addMatcher(
        (action: AnyAction): action is AnyAction =>
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
