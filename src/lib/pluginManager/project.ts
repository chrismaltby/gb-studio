import { readJSON } from "fs-extra";
import { glob } from "lib/helpers/glob";
import { join, dirname, relative } from "path";
import { InstalledPluginData } from "./types";
import { pathToPosix } from "shared/lib/helpers/path";

export const getPluginsInProject = async (projectPath: string) => {
  const projectRoot = dirname(projectPath);
  const pluginPaths = await glob("**/plugin.json", {
    cwd: projectRoot,
    absolute: true,
  });
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
    } catch {
      console.error("Error: Unable to parse " + pluginPath);
    }
  }
  return plugins;
};
