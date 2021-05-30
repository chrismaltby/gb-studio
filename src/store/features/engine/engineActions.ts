import { createAction } from "@reduxjs/toolkit";
import { actions } from "./engineState";

const scanEngine = createAction<string>("engine/scan");

export default {
  ...actions,
  scanEngine,
};
