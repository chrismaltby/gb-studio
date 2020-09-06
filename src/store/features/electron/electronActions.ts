import { createAction } from "@reduxjs/toolkit";

const openHelp = createAction<string>("electron/openHelp");
const openFolder = createAction<string>("electron/openFolder");

export default {
  openHelp,
  openFolder,
};
