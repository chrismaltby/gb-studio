import Path from "path";
import { readJSON, pathExists } from "fs-extra";
import glob from "glob";
import uniqBy from "lodash/uniqBy";
import { defaultEngineMetaPath } from "consts";
import type {
  SceneTypeSchema,
  EngineFieldSchema,
} from "store/features/engine/engineState";

export interface EngineSchema {
  fields: EngineFieldSchema[];
  sceneTypes: SceneTypeSchema[];
  consts: Record<string, number>;
}

const defaultSceneTypes: SceneTypeSchema[] = [
  { key: "TOPDOWN", label: "GAMETYPE_TOP_DOWN" },
  { key: "PLATFORM", label: "GAMETYPE_PLATFORMER" },
  { key: "ADVENTURE", label: "GAMETYPE_ADVENTURE" },
  { key: "SHMUP", label: "GAMETYPE_SHMUP" },
  { key: "POINTNCLICK", label: "GAMETYPE_POINT_N_CLICK" },
  { key: "LOGO", label: "GAMETYPE_LOGO" },
];

export const loadEngineSchema = async (
  projectRoot: string,
): Promise<EngineSchema> => {
  const localEngineJsonPath = Path.join(
    projectRoot,
    "assets",
    "engine",
    "engine.json",
  );
  const pluginsPath = Path.join(projectRoot, "plugins");

  let defaultEngine: Partial<EngineSchema> = {};
  let localEngine: Partial<EngineSchema> = {};

  try {
    localEngine = await readJSON(localEngineJsonPath);
  } catch {
    defaultEngine = await readJSON(defaultEngineMetaPath);
  }

  let fields = localEngine.fields || defaultEngine.fields || [];
  let sceneTypes =
    localEngine.sceneTypes || defaultEngine.sceneTypes || defaultSceneTypes;
  let consts = localEngine.consts || defaultEngine.consts || {};

  const enginePlugins = glob.sync(`${pluginsPath}/*/engine`);
  for (const enginePluginPath of enginePlugins) {
    const enginePluginJsonPath = Path.join(enginePluginPath, "engine.json");
    if (await pathExists(enginePluginJsonPath)) {
      try {
        const pluginEngine: EngineSchema = await readJSON(enginePluginJsonPath);
        if (pluginEngine.fields?.length) {
          fields = fields.concat(pluginEngine.fields);
        }
        if (pluginEngine.sceneTypes?.length) {
          sceneTypes = sceneTypes.concat(pluginEngine.sceneTypes);
        }
        if (pluginEngine.consts) {
          consts = { ...consts, ...pluginEngine.consts }; // Plugin consts override existing ones
        }
      } catch (e) {
        console.warn(e);
      }
    }
  }

  // Deduplicate sceneTypes by key
  sceneTypes = uniqBy(sceneTypes, (s) => s.key);

  return {
    fields,
    sceneTypes,
    consts,
  };
};
