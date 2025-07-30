import { createAction } from "@reduxjs/toolkit";

const openHelp = createAction<string>("electron/openHelp");
const openFolder = createAction<string>("electron/openFolder");
const openFile = createAction<{
  filename: string;
  type?: "image" | "music";
}>("electron/openFile");

const showErrorBox = createAction<{ title: string; content: string }>(
  "electron/showErrorBox",
);

const electronActions = {
  openHelp,
  openFolder,
  openFile,
  showErrorBox,
};

export default electronActions;
