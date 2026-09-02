import fs from "fs-extra";
import copy from "lib/helpers/fsCopy";
import { ProjectResources } from "shared/lib/resources/types";
import { buildRunner } from "./buildRunner";
import { EngineSchema } from "lib/project/loadEngineSchema";
import { exportWebBuild } from "./webBuild";
import type { BuildResult } from "./buildWorker";

type BuildOptions = {
  buildType: "rom" | "web" | "pocket";
  projectRoot: string;
  tmpPath: string;
  engineSchema: EngineSchema;
  romFilename: string;
  outputRoot: string;
  make?: boolean;
  debugEnabled?: boolean;
  useCustomWebTemplate?: boolean;
  progress: (msg: string) => void;
  warnings: (msg: string) => void;
};

let cancelling = false;
let cancelFunction: (() => void) | undefined;

const buildProject = async (
  project: ProjectResources,
  {
    buildType = "rom",
    projectRoot = "/tmp",
    tmpPath = "/tmp",
    engineSchema,
    outputRoot = "/tmp/testing",
    romFilename,
    debugEnabled = false,
    useCustomWebTemplate = true,
    make = true,
    progress = (_msg: string) => {},
    warnings = (_msg: string) => {},
  }: BuildOptions,
): Promise<BuildResult> => {
  cancelling = false;

  const { result, kill } = buildRunner({
    project,
    buildType,
    projectRoot,
    engineSchema,
    tmpPath,
    outputRoot,
    romFilename,
    debugEnabled,
    make,
    progress,
    warnings,
  });

  cancelFunction = kill;
  let buildResult: BuildResult;
  try {
    buildResult = await result;
  } catch (error) {
    return cancelling
      ? { buildStatus: "cancelled" }
      : {
          buildStatus: "failed",
          error: error instanceof Error ? error.toString() : String(error),
        };
  }

  if (cancelling) {
    return { buildStatus: "cancelled" };
  }

  if (buildResult.buildStatus !== "success") {
    return buildResult;
  }

  try {
    if (buildType === "web") {
      await exportWebBuild({
        project,
        projectRoot,
        destination: `${outputRoot}/build/web`,
        romFilename,
        romPath: `${outputRoot}/build/rom/${romFilename}`,
        webTemplate: useCustomWebTemplate ? project.settings.webTemplate : "",
        warnings,
      });
    } else if (buildType === "pocket") {
      await fs.mkdir(`${outputRoot}/build/pocket`);
      await copy(
        `${outputRoot}/build/rom/${romFilename}`,
        `${outputRoot}/build/pocket/${romFilename}`,
      );
    }
  } catch (error) {
    return {
      buildStatus: "failed",
      error: error instanceof Error ? error.toString() : String(error),
    };
  }
  return buildResult;
};

export const cancelCompileStepsInProgress = () => {
  cancelling = true;
  if (cancelFunction) {
    cancelFunction();
  }
};

export default buildProject;
