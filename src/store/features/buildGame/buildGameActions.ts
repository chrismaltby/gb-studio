import { createAction } from "@reduxjs/toolkit";

export type BuildType = "web" | "rom" | "pocket";
export type ProjectExportType = "src" | "data";

const buildGame = createAction(
  "buildGame/build",
  (
    {
      buildType = "web",
      exportBuild = false,
      debugEnabled = false,
    }: {
      buildType?: BuildType;
      exportBuild?: boolean;
      debugEnabled?: boolean;
    } = {
      buildType: "web",
      exportBuild: false,
      debugEnabled: false,
    }
  ) => {
    return {
      payload: {
        buildType,
        exportBuild,
        debugEnabled,
      },
    };
  }
);

const deleteBuildCache = createAction("buildGame/deleteCache");
const ejectEngine = createAction("buildGame/ejectEngine");
const exportProject = createAction<ProjectExportType>(
  "buildGame/exportProject"
);

const buildGameActions = {
  buildGame,
  deleteBuildCache,
  ejectEngine,
  exportProject,
};

export default buildGameActions;
