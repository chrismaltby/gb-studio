import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ErrorState {
  visible: boolean;
  message: string;
  filename: string;
  line: number;
  col: number;
  stackTrace: string;
}

export const initialState: ErrorState = {
  visible: false,
  message: "",
  filename: "",
  line: 0,
  col: 0,
  stackTrace: "",
};

const errorSlice = createSlice({
  name: "error",
  initialState,
  reducers: {
    setGlobalError: (
      state,
      action: PayloadAction<{
        message: string;
        filename: string;
        line: number;
        col: number;
        stackTrace: string;
      }>
    ) => {
      return {
        ...state,
        ...action.payload,
        visible: true,
      };
    },
  },
});

export const { reducer, actions } = errorSlice;

export default reducer;
