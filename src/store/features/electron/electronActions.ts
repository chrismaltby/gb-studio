import { createAction } from "@reduxjs/toolkit";

const openHelp = createAction<string>("electron/openHelp");
const openFolder = createAction<string>("electron/openFolder");
const openFile =
  createAction<{
    filename: string;
    type?: "image" | "music";
  }>("electron/openFile");

const showErrorBox = createAction<{ title: string; content: string }>(
  "electron/showErrorBox"
);

export default {
  openHelp,
  openFolder,
  openFile,
  showErrorBox,
};
