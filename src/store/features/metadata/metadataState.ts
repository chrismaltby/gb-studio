import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "store/configureStore";
import projectActions from "../project/projectActions";

export interface MetadataState {
  name: string;
  author: string;
  notes: string;
  _version: string;
  _release: string;
}

export const initialState: MetadataState = {
  name: "",
  author: "",
  notes: "",
  _version: "",
  _release: "",
};

const metadataSlice = createSlice({
  name: "metadata",
  initialState,
  reducers: {
    editMetadata: (state, action: PayloadAction<Partial<MetadataState>>) => {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
  extraReducers: (builder) =>
    builder.addCase(projectActions.loadProject.fulfilled, (state, action) => {
      const { name, author, notes, _version, _release } = action.payload.data;
      return {
        ...state,
        name,
        author,
        notes,
        _version,
        _release,
      };
    }),
});

export const getMetadata = (state: RootState) => state.project.present.metadata;

export const { actions, reducer } = metadataSlice;

export default reducer;
