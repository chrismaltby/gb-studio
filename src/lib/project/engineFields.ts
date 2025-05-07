import Path from "path";
import { readJSON, pathExists } from "fs-extra";
import type { EngineFieldSchema } from "store/features/engine/engineState";
import { defaultEngineMetaPath } from "consts";
import glob from "glob";

interface EngineData {
  fields?: EngineFieldSchema[];
}

export const loadEngineFields = async (
  projectRoot: string
): Promise<EngineFieldSchema[]> => {
  const localEngineJsonPath = Path.join(
    projectRoot,
    "assets",
    "engine",
    "engine.json"
  );
  const pluginsPath = Path.join(projectRoot, "plugins");

  let defaultEngine: EngineData = {};
  let localEngine: EngineData = {};

  try {
    localEngine = await readJSON(localEngineJsonPath);
  } catch (e) {
    defaultEngine = await readJSON(defaultEngineMetaPath);
  }

  let fields: EngineFieldSchema[] = [];

  if (localEngine && localEngine.fields) {
    fields = localEngine.fields;
  } else if (defaultEngine && defaultEngine.fields) {
    fields = defaultEngine.fields;
  }

  const enginePlugins = glob.sync(`${pluginsPath}/*/engine`);
  for (const enginePluginPath of enginePlugins) {
    const enginePluginJsonPath = Path.join(enginePluginPath, "engine.json");
    if (await pathExists(enginePluginJsonPath)) {
      try {
        const pluginEngine = await readJSON(enginePluginJsonPath);
        if (pluginEngine.fields && pluginEngine.fields.length > 0) {
          fields = fields.concat(pluginEngine.fields);
        }
      } catch (e) {
        console.warn(e);
      }
    }
  }

  return fields;
};
