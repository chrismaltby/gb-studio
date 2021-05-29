import { Dispatch, Middleware } from "@reduxjs/toolkit";
import Path from "path";
import { readJSON } from "fs-extra";
import { RootState } from "store/configureStore";
import actions from "./engineActions";
import { engineRoot } from "../../../consts";
import { EngineFieldSchema } from "./engineState";
import events, {
  engineFieldUpdateEvents,
  engineFieldStoreEvents,
  EventField,
} from "lib/events";
import {
  EVENT_ENGINE_FIELD_SET,
  EVENT_ENGINE_FIELD_STORE,
} from "lib/compiler/eventTypes";
import { clampToCType, is16BitCType } from "lib/helpers/engineFields";
import l10n from "lib/helpers/l10n";
import { setDefault } from "lib/helpers/setDefault";

interface EngineData {
  fields?: EngineFieldSchema[];
}

const engineMiddleware: Middleware<Dispatch, RootState> =
  (store) => (next) => async (action) => {
    if (actions.scanEngine.match(action)) {
      const defaultEngineJsonPath = Path.join(engineRoot, "gb", "engine.json");
      const localEngineJsonPath = Path.join(
        Path.dirname(action.payload),
        "assets",
        "engine",
        "engine.json"
      );

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

      updateEngineFieldEvents(fields);

      store.dispatch(actions.setEngineFields(fields));
    }
    next(action);
  };

const updateEngineFieldEvents = (engineFields: EngineFieldSchema[]) => {
  const fieldUpdateHandler = events[EVENT_ENGINE_FIELD_SET];
  const fieldStoreHandler = events[EVENT_ENGINE_FIELD_STORE];

  if (!fieldUpdateHandler || !fieldStoreHandler) {
    return;
  }

  engineFields.forEach((engineField) => {
    const fieldType = engineField.type || "number";

    const updateValueField = is16BitCType(engineField.cType)
      ? {
          key: "value",
          type: "union",
          checkboxLabel: l10n(engineField.label),
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
        }
      : {
          key: "value",
          type: "union",
          checkboxLabel: l10n(engineField.label),
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

    const storeValueField = {
      key: "value",
      type: "variable",
      defaultValue: "0",
    };

    engineFieldUpdateEvents[engineField.key] = {
      ...fieldUpdateHandler,
      fields: ([] as EventField[]).concat(
        fieldUpdateHandler.fields || [],
        updateValueField
      ),
    };

    engineFieldStoreEvents[engineField.key] = {
      ...fieldStoreHandler,
      fields: ([] as EventField[]).concat(
        fieldStoreHandler.fields || [],
        storeValueField
      ),
    };
  });
};

export default engineMiddleware;
