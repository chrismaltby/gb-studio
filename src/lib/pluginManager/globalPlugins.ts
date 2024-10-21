import { app } from "electron";
import { mkdir } from "fs-extra";
import { join, relative, dirname } from "path";
import glob from "glob";
import rimraf from "rimraf";
import { promisify } from "util";
import { InstalledPluginData } from "./types";
import { readJSON } from "fs-extra";
import { guardAssetWithinProject } from "lib/helpers/assets";
import confirmDeletePlugin from "lib/electron/dialog/confirmDeletePlugin";
import { removeEmptyFoldersBetweenPaths } from "lib/helpers/fs/removeEmptyFoldersBetweenPaths";

const rmdir = promisify(rimraf);

const globAsync = promisify(glob);

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

export const getPluginsInstalledGlobally = async () => {
  const globalPluginsPath = getGlobalPluginsPath();
  const pluginPaths = await globAsync(
    join(globalPluginsPath, "**/plugin.json")
  );
  const plugins: InstalledPluginData[] = [];
  for (const pluginPath of pluginPaths) {
    try {
      const pluginJSON = await readJSON(pluginPath);
      if ("version" in pluginJSON && typeof pluginJSON.version === "string") {
        plugins.push({
          path: relative(globalPluginsPath, pluginPath),
          version: pluginJSON.version,
        });
      }
    } catch (e) {
      console.error("Error: Unable to parse " + pluginPath);
    }
  }
  return plugins;
};

export const removeGlobalPlugin = async (pluginId: string) => {
  const globalPluginsPath = getGlobalPluginsPath();
  const outputPath = join(globalPluginsPath, pluginId);
  guardAssetWithinProject(outputPath, globalPluginsPath);

  const cancel = confirmDeletePlugin(
    pluginId,
    relative(globalPluginsPath, outputPath)
  );
  if (cancel) {
    return;
  }
  await rmdir(outputPath);
  await removeEmptyFoldersBetweenPaths(globalPluginsPath, dirname(outputPath));
};
