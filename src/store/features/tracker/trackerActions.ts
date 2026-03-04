import { createAsyncThunk } from "@reduxjs/toolkit";
import { actions as reducerActions, TrackerViewType } from "./trackerState";
import API from "renderer/lib/api";

export const initViewFromSaved = createAsyncThunk(
  "tracker/initView",
  async (_, thunkApi) => {
    const view = await API.settings.getString("trackerView", "roll");
    if (view === "tracker" || view === "roll") {
      thunkApi.dispatch(actions.setView(view));
    }
  },
);

export const setViewAndSave = createAsyncThunk<void, TrackerViewType>(
  "tracker/setViewAndSave",
  async (payload, thunkApi) => {
    thunkApi.dispatch(actions.setView(payload));
    await API.settings.set("trackerView", payload);
  },
);

const actions = {
  ...reducerActions,
  initViewFromSaved,
  setViewAndSave,
};

export default actions;
