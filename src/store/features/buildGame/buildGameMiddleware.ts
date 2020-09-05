import { createAction, Middleware } from "@reduxjs/toolkit";
import { RootState } from "../../configureStore";

export type BuildType = "web" | "rom";

const buildGame = createAction<{
  buildType: BuildType;
  exportBuild: boolean;
  ejectBuild: boolean;
}>("buildGame/build");

const deleteBuildCache = createAction("buildGame/deleteCache");
const ejectEngine = createAction("buildGame/ejectEngine");

const buildGameMiddleware: Middleware<{}, RootState> = (store) => (next) => (
  action
) => {
  if (buildGame.match(action)) {
    //
  } else if (deleteBuildCache.match(action)) {
    //
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
