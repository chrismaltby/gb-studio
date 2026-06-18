import fs from "fs-extra";
import copy from "lib/helpers/fsCopy";
import { ProjectResources } from "shared/lib/resources/types";
import { buildRunner } from "./buildRunner";
import { EngineSchema } from "lib/project/loadEngineSchema";
import { exportWebBuild } from "./webBuild";

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
) => {
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
  const compiledData = await result;

  if (cancelling) {
    throw new Error("BUILD_CANCELLED");
  }

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
  return compiledData;
};

export const cancelCompileStepsInProgress = () => {
  cancelling = true;
  if (cancelFunction) {
    cancelFunction();
  }
};

export default buildProject;
