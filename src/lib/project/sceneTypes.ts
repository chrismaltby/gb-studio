import EventEmitter from "events";
import Path from "path";
import { readJSON, pathExists } from "fs-extra";
import type { SceneTypeSchema } from "store/features/engine/engineState";
import { defaultEngineMetaPath } from "consts";
import glob from "glob";
import uniqBy from "lodash/uniqBy";

interface EngineData {
  sceneTypes?: SceneTypeSchema[];
}

export interface SceneTypeSyncResult {
  sceneTypes: SceneTypeSchema[];
}

export const sceneTypesEmitter = new EventEmitter.EventEmitter();

const defaultSceneTypes = [
  {
    key: "TOPDOWN",
    label: "GAMETYPE_TOP_DOWN",
  },
  {
    key: "PLATFORM",
    label: "GAMETYPE_PLATFORMER",
  },
  {
    key: "ADVENTURE",
    label: "GAMETYPE_ADVENTURE",
  },
  {
    key: "SHMUP",
    label: "GAMETYPE_SHMUP",
  },
  {
    key: "POINTNCLICK",
    label: "GAMETYPE_POINT_N_CLICK",
  },
  {
    key: "LOGO",
    label: "GAMETYPE_LOGO",
  },
];

export const loadSceneTypes = async (
  projectRoot: string,
): Promise<SceneTypeSchema[]> => {
  const localEngineJsonPath = Path.join(
    projectRoot,
    "assets",
    "engine",
    "engine.json",
  );
  const pluginsPath = Path.join(projectRoot, "plugins");

  let defaultEngine: EngineData = {};
  let localEngine: EngineData = {};

  try {
    localEngine = await readJSON(localEngineJsonPath);
  } catch (e) {
    defaultEngine = await readJSON(defaultEngineMetaPath);
  }

  let sceneTypes: SceneTypeSchema[] = [];

  if (localEngine && localEngine.sceneTypes) {
    sceneTypes = localEngine.sceneTypes;
  } else if (defaultEngine && defaultEngine.sceneTypes) {
    sceneTypes = defaultEngine.sceneTypes;
  }

  if (!sceneTypes || (sceneTypes && sceneTypes.length === 0)) {
    sceneTypes = defaultSceneTypes;
  }

  const enginePlugins = glob.sync(`${pluginsPath}/**/engine`);
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

  // Remove duplicate scene types
  sceneTypes = uniqBy(sceneTypes, (s) => s.key);

  return sceneTypes;
};
