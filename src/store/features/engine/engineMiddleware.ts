import { Dictionary, Middleware } from "@reduxjs/toolkit";
import Path from "path";
import { readJSON } from "fs-extra";
import { RootState } from "../../configureStore";
import actions from "./engineActions";
import { engineRoot } from "../../../consts";
import { EnginePropSchemaField } from "./engineState";

interface EngineData {
  fields?: EnginePropSchemaField[];
}

const engineMiddleware: Middleware<{}, RootState> = (store) => (next) => async (
  action
) => {
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
      console.log("Unable to get local engine");
      defaultEngine = await readJSON(defaultEngineJsonPath);
    }

    let fields: EnginePropSchemaField[] = [];

    if (localEngine && localEngine.fields) {
      fields = localEngine.fields;
    } else if (defaultEngine && defaultEngine.fields) {
      fields = defaultEngine.fields;
    }

    store.dispatch(actions.setEngineFields(fields));
  }
  next(action);
};

export default engineMiddleware;
