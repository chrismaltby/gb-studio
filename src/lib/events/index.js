/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
import glob from "glob";
import fs from "fs";
import plugins, { pluginEmitter } from "../plugins/plugins";
import { eventsRoot } from "../../consts";
import * as l10n from "../helpers/l10n";
import * as eventHelpers from "./helpers";
import * as gbStudioHelpers from "../helpers/gbstudio";
import * as eventSystemHelpers from "../helpers/eventSystem";
import * as compileEntityEvents from "../compiler/compileEntityEvents";
import trimLines from "../helpers/trimlines";
import store from "../../store/configureStore";
import { clampToCType, is16BitCType } from "../helpers/engineFields";
import { setDefault } from "../helpers/setDefault";

const VM2 = __non_webpack_require__("vm2");
const NodeVM = VM2.NodeVM;

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
      "../helpers/trimlines": trimLines
    }
  }
});

const eventHandlers = {
  ...internalEventHandlerPaths.reduce((memo, path) => {
    const handlerCode = fs.readFileSync(path, "utf8");
    const handler = vm.run(handlerCode);
    if (!handler.id) {
      throw new Error(`Event handler ${path} is missing id`);
    }
    return {
      ...memo,
      [handler.id]: handler
    };
  }, {}),
  ...plugins.events
};

pluginEmitter.on("update-event", plugin => {
  eventHandlers[plugin.id] = plugin;
});

pluginEmitter.on("add-event", plugin => {
  eventHandlers[plugin.id] = plugin;
});

pluginEmitter.on("remove-event", plugin => {
  delete eventHandlers[plugin.id];
});

let currentEngineFields = null;
const engineFieldUpdateEvents = {};
const engineFieldStoreEvents = {};

store.subscribe(() => {
  const state = store.getState();
  const prevEngineFields = currentEngineFields;
  currentEngineFields = state.engine.fields;
  if (currentEngineFields !== prevEngineFields) {
    const fieldUpdateHandler = eventHandlers.EVENT_ENGINE_FIELD_SET;
    const fieldStoreHandler = eventHandlers.EVENT_ENGINE_FIELD_STORE;

    currentEngineFields.forEach((engineField) => {
      const fieldType = engineField.type || "number";

      const updateValueField = is16BitCType(engineField.cType)
        ? {
            key: "value",
            type: "union",
            checkboxLabel: l10n.default(engineField.label),
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
            variableType: "16bit",
            options: engineField.options || [],
            defaultValue: {
              [fieldType]: engineField.defaultValue || 0,
              variable: "0",
            },
          }
        : {
            key: "value",
            type: "union",
            checkboxLabel: l10n.default(engineField.label),
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
              variable: "0",
            },
          };

      const storeValueField = is16BitCType(engineField.cType)
        ? {
            key: "value",
            type: "variable",
            defaultValue: "0",
            variableType: "16bit",
          }
        : {
            key: "value",
            type: "variable",
            defaultValue: "0",
          };

      engineFieldUpdateEvents[engineField.key] = {
        ...fieldUpdateHandler,
        fields: [].concat(fieldUpdateHandler.fields || [], updateValueField),
      };

      engineFieldStoreEvents[engineField.key] = {
        ...fieldStoreHandler,
        fields: [].concat(fieldStoreHandler.fields || [], storeValueField),
      };
    });
  }
});

export default eventHandlers;

export {
  engineFieldUpdateEvents,
  engineFieldStoreEvents
}