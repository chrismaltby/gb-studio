import { createSlice, AnyAction } from "@reduxjs/toolkit";
import { loadProject } from "../entities/entitiesSlice";

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
        action.type.startsWith("entities/") && !loadProject.match(action),
      (state, _action) => {
        state.modified = true;
      }
    ),
});

const { reducer } = documentSlice;

export default reducer;
