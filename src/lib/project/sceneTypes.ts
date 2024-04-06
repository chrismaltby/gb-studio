import EventEmitter from "events";
import Path from "path";
import { readJSON, pathExists } from "fs-extra";
import type { SceneTypeSchema } from "store/features/engine/engineState";
import { engineRoot } from "consts";
import glob from "glob";

interface EngineData {
  sceneTypes?: SceneTypeSchema[];
}

export interface SceneTypeSyncResult {
  sceneTypes: SceneTypeSchema[];
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

  let sceneTypes: SceneTypeSchema[] = [];

  if (localEngine && localEngine.sceneTypes) {
    sceneTypes = localEngine.sceneTypes;
  } else if (defaultEngine && defaultEngine.sceneTypes) {
    sceneTypes = defaultEngine.sceneTypes;
  }

  const enginePlugins = glob.sync(`${pluginsPath}/*/engine`);
  for (const enginePluginPath of enginePlugins) {
    const enginePluginJsonPath = Path.join(enginePluginPath, "engine.json");
    if (await pathExists(enginePluginJsonPath)) {
      try {
        const pluginEngine = await readJSON(enginePluginJsonPath);
        if (pluginEngine.sceneTypes) {
          sceneTypes = sceneTypes.concat(pluginEngine.sceneTypes);
        }
      } catch (e) {
        console.warn(e);
      }
    }
  }

  return sceneTypes;
};
