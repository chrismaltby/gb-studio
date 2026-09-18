import fs from "fs-extra";
import copy from "lib/helpers/fsCopy";
import { ProjectResources } from "shared/lib/resources/types";
import { buildRunner } from "./buildRunner";
import { EngineSchema } from "lib/project/loadEngineSchema";
import { exportWebBuild } from "./webBuild";
import type { BuildResult } from "./buildResult";

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
  const buildResult = await result;
  if (cancelFunction === kill) {
    cancelFunction = undefined;
  }

  if (buildResult.status !== "success") {
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
      status: "failed",
      stage: "export",
      error: error instanceof Error ? error.toString() : String(error),
      compiledData: buildResult.compiledData,
      manifest: buildResult.manifest,
    };
  }
  return buildResult;
};

export const cancelCompileStepsInProgress = () => {
  if (cancelFunction) {
    cancelFunction();
  }
};

export default buildProject;
