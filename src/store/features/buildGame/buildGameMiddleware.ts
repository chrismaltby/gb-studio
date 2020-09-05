import { createAction, Middleware } from "@reduxjs/toolkit";
import Path from "path";
import rimraf from "rimraf";
import { promisify } from "util";
import getTmp from "../../../lib/helpers/getTmp";
import { RootState } from "../../configureStore";
import { actions as consoleActions } from "../console/consoleSlice";

const rmdir = promisify(rimraf);

export type BuildType = "web" | "rom";

const buildGame = createAction<{
  buildType: BuildType;
  exportBuild: boolean;
  ejectBuild: boolean;
}>("buildGame/build");

const deleteBuildCache = createAction("buildGame/deleteCache");
const ejectEngine = createAction("buildGame/ejectEngine");

const buildGameMiddleware: Middleware<{}, RootState> = (store) => (next) => async (
  action
) => {
  if (buildGame.match(action)) {
    //
  } else if (deleteBuildCache.match(action)) {

    const dispatch = store.dispatch.bind(store);
    const cacheRoot = Path.normalize(`${getTmp()}/_gbscache`);
    await rmdir(cacheRoot);
    dispatch(consoleActions.clearConsole());
    dispatch(consoleActions.stdOut("Cleared GB Studio caches"));

  } else if (ejectEngine.match(action)) {
    //
  }

  return next(action);
};

export const actions = {
  buildGame,
  deleteBuildCache,
  ejectEngine
};

export default buildGameMiddleware;
