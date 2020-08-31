import { createSlice, AnyAction } from "@reduxjs/toolkit";
import { loadProject } from "../entities/entitiesSlice";
import { loadMetadata } from "../metadata/metadataSlice";
import { loadSettings } from "../settings/settingsSlice";

interface DocumentState {
  modified: boolean;
}

const initialState: DocumentState = {
  modified: false,
};

const documentSlice = createSlice({
  name: "document",
  initialState,
  reducers: {},
  extraReducers: (builder) =>
    builder.addMatcher(
      (action: AnyAction): action is AnyAction =>
        (action.type.startsWith("entities/") ||
          action.type.startsWith("metadata/") ||
          action.type.startsWith("settings/")) &&
        !loadProject.match(action) && !loadMetadata.match(action) && !loadSettings.match(action),
      (state, _action) => {
        state.modified = true;
      }
    ),
});

const { reducer } = documentSlice;

export default reducer;
