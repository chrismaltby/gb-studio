import glob from "glob";
import fs from "fs";
import plugins, { pluginEmitter } from "lib/plugins/plugins";
import { eventsRoot } from "consts";
import * as l10n from "shared/lib/lang/l10n";
import * as eventHelpers from "./helpers";
import * as gbStudioHelpers from "lib/helpers/gbstudio";
import * as eventSystemHelpers from "lib/helpers/eventSystem";
import * as compileEntityEvents from "lib/compiler/compileEntityEvents";
import trimLines from "shared/lib/helpers/trimlines";
import type { ScriptEventFieldSchema } from "shared/lib/entities/entitiesTypes";
import { Dictionary } from "@reduxjs/toolkit";
import { clone, cloneDictionary } from "lib/helpers/clone";
import { ScriptEventHandler } from "lib/project/loadScriptEvents";
const VM2 = __non_webpack_require__("vm2");
const NodeVM = VM2.NodeVM;

// @TODO this file should be removed, any files that import events should instead be passed the values from calling `loadScriptEvents()`

export type ScriptEventHandlersLookup = Dictionary<ScriptEventHandler>;

const internalEventHandlerPaths = glob.sync(`${eventsRoot}/event*.js`);

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
      "../helpers/trimlines": trimLines, // @TODO Add deprecated warning when using this import
      "shared/lib/helpers/trimlines": trimLines,
    },
  },
});

const eventHandlers: Dictionary<ScriptEventHandler> = {};

// Plain old Javascript object versions of event handlers.
// These are safe for passing into web workers
// Where VM2 proxied objects cannot be used
// Only primitive types can be accessed, function types will be undefined
export const pojoEventHandlers = cloneDictionary(eventHandlers);

pluginEmitter.on("update-event", (plugin: ScriptEventHandler) => {
  eventHandlers[plugin.id] = plugin;
  pojoEventHandlers[plugin.id] = clone(plugin);
});

pluginEmitter.on("add-event", (plugin: ScriptEventHandler) => {
  eventHandlers[plugin.id] = plugin;
  pojoEventHandlers[plugin.id] = clone(plugin);
});

pluginEmitter.on("remove-event", (plugin: ScriptEventHandler) => {
  delete eventHandlers[plugin.id];
  delete pojoEventHandlers[plugin.id];
});

export const initEvents = async () => {
  for (const path of internalEventHandlerPaths) {
    const handlerCode = fs.readFileSync(path, "utf8");
    const handler = vm.run(handlerCode) as ScriptEventHandler;
    if (!handler.id) {
      throw new Error(`Event handler ${path} is missing id`);
    }
    handler.isConditional =
      handler.fields && !!handler.fields.find((f) => f.type === "events");

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
    handler.fieldsLookup = {};
    buildFieldsLookup(handler.fields);

    eventHandlers[handler.id] = handler;
    pojoEventHandlers[handler.id] = clone(handler);
  }
};

export const eventLookup = {
  eventsLookup: eventHandlers,
} as const;

export default eventHandlers;
