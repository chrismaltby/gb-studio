import { contextBridge } from "electron";
import APISetup from "renderer/lib/api/setup";

contextBridge.exposeInMainWorld("API", APISetup);

export default contextBridge;
