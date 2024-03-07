import EventEmitter from "events";
import Path from "path";
import { readJSON, pathExists } from "fs-extra";
import type { EngineFieldSchema } from "store/features/engine/engineState";
import { engineRoot } from "consts";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import { clampToCType } from "shared/lib/engineFields/engineFieldToCType";
import { setDefault } from "shared/lib/helpers/setDefault";
import type { ScriptEventFieldSchema } from "shared/lib/entities/entitiesTypes";
import glob from "glob";

interface EngineData {
  fields?: EngineFieldSchema[];
}

export type EngineFieldSchemaLookup = Record<
  string,
  {
    update: ScriptEventFieldSchema;
    store: ScriptEventFieldSchema;
  }
>;

export interface EngineFieldSyncResult {
  fields: EngineFieldSchema[];
  schemaLookup: EngineFieldSchemaLookup;
}

export const engineFieldsEmitter = new EventEmitter.EventEmitter();

const getEngineFieldSchemas = (engineFields: EngineFieldSchema[]) => {
  const fields: EngineFieldSchemaLookup = {};

  engineFields.forEach((engineField) => {
    const fieldType = engineField.type || "number";

    const updateValueField = {
      key: "value",
      type: "union",
      checkboxLabel: l10n(engineField.label as L10NKey),
      types: [fieldType, "variable"],
      defaultType: fieldType,
      min: clampToCType(
        setDefault(engineField.min, -Infinity),
        engineField.cType
      ),
      max: clampToCType(
        setDefault(engineField.max, Infinity),
        engineField.cType
      ),
      options: engineField.options || [],
      defaultValue: {
        [fieldType]: engineField.defaultValue || 0,
        variable: "LAST_VARIABLE",
      },
    };

    const storeValueField = {
      key: "value",
      type: "variable",
      defaultValue: "LAST_VARIABLE",
    };

    fields[engineField.key] = {
      update: updateValueField,
      store: storeValueField,
    };
  });

  return fields;
};

export const initEngineFields = async (
  projectRoot: string
): Promise<EngineFieldSyncResult> => {
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

  let fields: EngineFieldSchema[] = [];

  if (localEngine && localEngine.fields) {
    fields = localEngine.fields;
  } else if (defaultEngine && defaultEngine.fields) {
    fields = defaultEngine.fields;
  }

  const enginePlugins = glob.sync(`${pluginsPath}/*/engine`);
  for (const enginePluginPath of enginePlugins) {
    const englinePluginJsonPath = Path.join(enginePluginPath, "engine.json");
    if (await pathExists(englinePluginJsonPath)) {
      try {
        const pluginEngine = await readJSON(englinePluginJsonPath);
        if (pluginEngine.fields && pluginEngine.fields.length > 0) {
          fields = fields.concat(pluginEngine.fields);
        }
      } catch (e) {
        console.warn(e);
      }
    }
  }

  engineFieldsEmitter.emit("sync", {
    fields,
    schemaLookup: getEngineFieldSchemas(fields),
  } as EngineFieldSyncResult);

  return {
    fields,
    schemaLookup: getEngineFieldSchemas(fields),
  };
};
