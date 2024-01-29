import APISetup from "renderer/lib/api/setup";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).API = APISetup;
export {};

/* ***************************
 * When ready to enable contextIsolation, should be able to replace the above with the following

import { contextBridge } from "electron";
import APISetup from "renderer/lib/api/setup";

contextBridge.exposeInMainWorld("API", APISetup);

export default contextBridge;

*/
