import { readJSON } from "fs-extra";
import glob from "glob";
import { join, dirname, relative } from "path";
import { promisify } from "util";
import { InstalledPluginData } from "./types";
import { pathToPosix } from "shared/lib/helpers/path";

const globAsync = promisify(glob);

export const getPluginsInProject = async (projectPath: string) => {
  const projectRoot = dirname(projectPath);
  const pluginPaths = await globAsync(join(projectRoot, "**/plugin.json"));
  const plugins: InstalledPluginData[] = [];
  for (const pluginPath of pluginPaths) {
    try {
      const pluginJSON = await readJSON(pluginPath);
      if ("version" in pluginJSON && typeof pluginJSON.version === "string") {
        plugins.push({
          path: pathToPosix(relative(join(projectRoot, "plugins"), pluginPath)),
          version: pluginJSON.version,
        });
      }
    } catch (e) {
      console.error("Error: Unable to parse " + pluginPath);
    }
  }
  return plugins;
};
