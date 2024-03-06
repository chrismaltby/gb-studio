import glob from "glob";
import { promisify } from "util";
import { eventsRoot } from "consts";
import * as l10n from "shared/lib/lang/l10n";
import * as eventHelpers from "lib/events/helpers";
import * as gbStudioHelpers from "lib/helpers/gbstudio";
import * as eventSystemHelpers from "lib/helpers/eventSystem";
import * as compileEntityEvents from "lib/compiler/compileEntityEvents";
import type { ScriptEventFieldSchema } from "shared/lib/entities/entitiesTypes";
import { Dictionary } from "@reduxjs/toolkit";
import { readFile } from "fs-extra";
import trimLines from "shared/lib/helpers/trimlines";

const globAsync = promisify(glob);

const VM2 = __non_webpack_require__("vm2");
const NodeVM = VM2.NodeVM;

export interface ScriptEventDef {
  id: string;
  fields: ScriptEventFieldSchema[];
  name?: string;
  description?: string;
  groups?: string[] | string;
  deprecated?: boolean;
  isConditional?: boolean;
  editableSymbol?: boolean;
  allowChildrenBeforeInitFade?: boolean;
  waitUntilAfterInitFade?: boolean;
  hasAutoLabel: boolean;
}

export type ScriptEventHandler = ScriptEventDef & {
  autoLabel?: (
    lookup: (key: string) => string,
    args: Record<string, unknown>
  ) => string;
  compile: (input: unknown, helpers: unknown) => void;
};

export interface ScriptEventDefLookup {
  byCommand: Dictionary<ScriptEventDef>;
  engineFieldUpdateByField: Dictionary<ScriptEventDef>;
  engineFieldStoreByField: Dictionary<ScriptEventDef>;
}

const vm = new NodeVM({
  timeout: 1000,
  sandbox: {},
  require: {
    mock: {
      "./helpers": eventHelpers,
      "../helpers/l10n": l10n,
      "../helpers/gbstudio": gbStudioHelpers,
      "../helpers/eventSystem": eventSystemHelpers,
      "../compiler/compileEntityEvents": compileEntityEvents,
      "../helpers/trimlines": trimLines,
      "shared/lib/helpers/trimlines": trimLines,
    },
  },
});

const loadScriptEventHandler = async (
  path: string
): Promise<ScriptEventHandler> => {
  const handlerCode = await readFile(path, "utf8");
  const handler = vm.run(handlerCode) as ScriptEventHandler;
  if (!handler.id) {
    throw new Error(`Event handler ${path} is missing id`);
  }
  handler.isConditional =
    handler.fields && !!handler.fields.find((f) => f.type === "events");
  handler.hasAutoLabel = !!handler.autoLabel;

  return handler;
};

const loadAllScriptEvents = async (projectRoot: string) => {
  const corePaths = await globAsync(`${eventsRoot}/event*.js`);

  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/**/events/event*.js`
  );

  // console.log({ corePaths, pluginPaths });

  const eventHandlers: Dictionary<ScriptEventDef> = {};
  for (const path of corePaths) {
    // // console.log("PATH", path);
    // const handlerCode = await readFile(path, "utf8");
    // const handler = vm.run(handlerCode) as ScriptEventDef;
    // if (!handler.id) {
    //   throw new Error(`Event handler ${path} is missing id`);
    // }
    // handler.isConditional =
    //   handler.fields && !!handler.fields.find((f) => f.type === "events");
    const handler = await loadScriptEventHandler(path);
    eventHandlers[handler.id] = handler;
  }
  for (const path of pluginPaths) {
    const handler = await loadScriptEventHandler(path);
    eventHandlers[handler.id] = handler;
  }

  return eventHandlers;
};

export default loadAllScriptEvents;
