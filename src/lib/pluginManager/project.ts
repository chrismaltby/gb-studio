import { readJSON } from "fs-extra";
import glob from "glob";
import { join, dirname, relative } from "path";
import { promisify } from "util";

const globAsync = promisify(glob);

export type InstalledPluginData = {
  path: string;
  version: string;
};

export const getsPluginsInProject = async (projectPath: string) => {
  const projectRoot = dirname(projectPath);
  const pluginPaths = await globAsync(join(projectRoot, "**/plugin.json"));
  const plugins: InstalledPluginData[] = [];
  for (const pluginPath of pluginPaths) {
    try {
      const pluginJSON = await readJSON(pluginPath);
      if ("version" in pluginJSON && typeof pluginJSON.version === "string") {
        plugins.push({
          path: relative(join(projectRoot, "plugins"), pluginPath),
          version: pluginJSON.version,
        });
      }
    } catch (e) {
      console.error("Error: Unable to parse " + pluginPath);
    }
  }
  return plugins;
};
