import EventEmitter from "events";
import Path from "path";
import { readJSON, pathExists } from "fs-extra";
import type { SceneTypeSchema } from "store/features/engine/engineState";
import { engineRoot } from "consts";
import glob from "glob";

interface EngineData {
  types?: SceneTypeSchema[];
}

export interface SceneTypeSyncResult {
  types: SceneTypeSchema[];
}

export const sceneTypesEmitter = new EventEmitter.EventEmitter();

export const loadSceneTypes = async (
  projectRoot: string
): Promise<SceneTypeSchema[]> => {
  const defaultEngineJsonPath = Path.join(engineRoot, "gb", "engine.json");
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
    defaultEngine = await readJSON(defaultEngineJsonPath);
  }

  let types: SceneTypeSchema[] = [];

  if (localEngine && localEngine.types) {
    types = localEngine.types;
  } else if (defaultEngine && defaultEngine.types) {
    types = defaultEngine.types;
  }

  const enginePlugins = glob.sync(`${pluginsPath}/*/engine`);
  for (const enginePluginPath of enginePlugins) {
    const enginePluginJsonPath = Path.join(enginePluginPath, "engine.json");
    if (await pathExists(enginePluginJsonPath)) {
      try {
        const pluginEngine = await readJSON(enginePluginJsonPath);
        if (pluginEngine.types) {
          types = types.concat(pluginEngine.types);
        }
      } catch (e) {
        console.warn(e);
      }
    }
  }

  return types;
};
