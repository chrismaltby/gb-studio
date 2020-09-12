import { createAction } from "@reduxjs/toolkit";

export type BuildType = "web" | "rom";

const buildGame = createAction(
  "buildGame/build",
  (
    {
      buildType = "web",
      exportBuild = false,
      ejectBuild = false,
    }: {
      buildType?: BuildType;
      exportBuild?: boolean;
      ejectBuild?: boolean;
    } = {
      buildType: "web",
      exportBuild: false,
      ejectBuild: false,
    }
  ) => {
    return {
      payload: {
        buildType,
        exportBuild,
        ejectBuild,
      },
    };
  }
);

const deleteBuildCache = createAction("buildGame/deleteCache");
const ejectEngine = createAction("buildGame/ejectEngine");

export default {
  buildGame,
  deleteBuildCache,
  ejectEngine,
};
