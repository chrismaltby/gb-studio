import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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
    editMetadata: (state, action: PayloadAction<Partial<MetadataState>>) => {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
});

export const { actions, reducer } = metadataSlice;

export default reducer;
