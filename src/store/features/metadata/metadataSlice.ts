import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../configureStore";

interface MetadataState {
  name: string;
  author: string;
  notes: string;
  _version: string;
  _release: string;
}

const initialState: MetadataState = {
    name: "",
    author: "",
    notes: "",
    _version: "",
    _release: ""
};

const metadataSlice = createSlice({
  name: "metadata",
  initialState,
  reducers: {
    loadMetadata: (state, action: PayloadAction<Partial<MetadataState>>) => {
      return {
        ...state,
        ...action.payload,
      };
    },
    editMetadata: (state, action: PayloadAction<Partial<MetadataState>>) => {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
});

export const getMetadata = (state: RootState) => state.project.present.metadata;

export const { actions, reducer } = metadataSlice;

export const { loadMetadata } = actions;

export default reducer;
