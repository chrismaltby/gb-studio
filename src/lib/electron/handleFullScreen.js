import { ipcRenderer } from "electron";

ipcRenderer.on("enter-full-screen", () => {
  document.body.className = `Platform__${process.platform} full-screen`;
});

ipcRenderer.on("leave-full-screen", () => {
  document.body.className = `Platform__${process.platform}`;
});

document.body.className = `Platform__${process.platform}`;

ipcRenderer.send("check-full-screen", {});
