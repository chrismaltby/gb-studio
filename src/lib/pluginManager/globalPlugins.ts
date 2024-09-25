import { app } from "electron";
import { mkdir } from "fs-extra";
import { join } from "path";

export const getGlobalPluginsPath = () => {
  const userDataPath = app.getPath("userData");
  const globalPluginsPath = join(userDataPath, "plugins");
  return globalPluginsPath;
};

export const ensureGlobalPluginsPath = async () => {
  const globalPluginsPath = getGlobalPluginsPath();
  await mkdir(globalPluginsPath, { recursive: true });
  return globalPluginsPath;
};
