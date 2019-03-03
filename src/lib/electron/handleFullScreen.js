import { ipcRenderer } from "electron";

ipcRenderer.on("enter-full-screen", () => {
  document.body.className = "full-screen";
});

ipcRenderer.on("leave-full-screen", () => {
  document.body.className = "";
});

ipcRenderer.send("check-full-screen", {});
