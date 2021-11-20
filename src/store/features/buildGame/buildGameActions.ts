import { createAction } from "@reduxjs/toolkit";

export type BuildType = "web" | "rom" | "pocket";
export type ProjectExportType = "src" | "data";

const buildGame = createAction(
  "buildGame/build",
  (
    {
      buildType = "web",
      exportBuild = false,
    }: {
      buildType?: BuildType;
      exportBuild?: boolean;
    } = {
      buildType: "web",
      exportBuild: false,
    }
  ) => {
    return {
      payload: {
        buildType,
        exportBuild,
      },
    };
  }
);

const deleteBuildCache = createAction("buildGame/deleteCache");
const ejectEngine = createAction("buildGame/ejectEngine");
const exportProject = createAction<ProjectExportType>(
  "buildGame/exportProject"
);

export default {
  buildGame,
  deleteBuildCache,
  ejectEngine,
  exportProject,
};
