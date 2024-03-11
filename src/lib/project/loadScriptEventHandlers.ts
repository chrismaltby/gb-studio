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
  fieldsLookup: Record<string, ScriptEventFieldSchema>;
}

export type ScriptEventHandlerFieldSchema = ScriptEventFieldSchema & {
  postUpdateFn?: (
    newArgs: Record<string, unknown>,
    prevArgs: Record<string, unknown>
  ) => void | Record<string, unknown>;
};

export type ScriptEventHandler = ScriptEventDef & {
  autoLabel?: (
    lookup: (key: string) => string,
    args: Record<string, unknown>
  ) => string;
  compile: (input: unknown, helpers: unknown) => void;
  fields: ScriptEventHandlerFieldSchema[];
  fieldsLookup: Record<string, ScriptEventHandlerFieldSchema>;
};

export type ScriptEventHandlers = Dictionary<ScriptEventHandler>;

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
  handler.fieldsLookup = {};

  // Add flags for existence of field callsbacks
  // Needed so renderer knows if API call to main process is needed
  for (const field of handler.fields) {
    field.hasPostUpdateFn = !!field.postUpdateFn;
  }

  // Build flat lookup table of field keys to field
  // To prevent needing to recursively loop through
  // nested fields at editor runtime
  const buildFieldsLookup = (fields: ScriptEventFieldSchema[]): void => {
    for (const field of fields) {
      if (field.type === "group" && field.fields) {
        buildFieldsLookup(field.fields);
      } else if (field.key) {
        handler.fieldsLookup[field.key] = field;
      }
    }
  };
  buildFieldsLookup(handler.fields);

  return handler;
};

const loadAllScriptEventHandlers = async (projectRoot: string) => {
  const corePaths = await globAsync(`${eventsRoot}/event*.js`);

  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/**/events/event*.js`
  );

  const eventHandlers: ScriptEventHandlers = {};
  for (const path of corePaths) {
    const handler = await loadScriptEventHandler(path);
    eventHandlers[handler.id] = handler;
  }
  for (const path of pluginPaths) {
    const handler = await loadScriptEventHandler(path);
    eventHandlers[handler.id] = handler;
  }

  return eventHandlers;
};

export default loadAllScriptEventHandlers;
