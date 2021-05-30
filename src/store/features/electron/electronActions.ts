import { createAction } from "@reduxjs/toolkit";

const openHelp = createAction<string>("electron/openHelp");
const openFolder = createAction<string>("electron/openFolder");
const openFile = createAction<{
  filename: string;
  type?: "image" | "music";
}>("electron/openFile");

export default {
  openHelp,
  openFolder,
  openFile,
};
