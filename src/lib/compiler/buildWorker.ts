import { parentPort, workerData, isMainThread, threadId } from "worker_threads";
import loadAllScriptEventHandlers from "lib/project/loadScriptEventHandlers";
import compileData from "./compileData";
import { ProjectResources } from "shared/lib/resources/types";
import { L10NLookup, setL10NData } from "shared/lib/lang/l10n";
import ejectBuild from "./ejectBuild";
import { validateEjectedBuild } from "./validate/validateEjectedBuild";
import makeBuild, { cancelBuildCommandsInProgress } from "./makeBuild";
import { EngineSchema } from "lib/project/loadEngineSchema";
import { createBuildManifest, resolveBuildSources } from "./buildManifest";
import type { BuildArtifacts, BuildWorkerResult } from "./buildResult";

export type BuildType = "rom" | "web" | "pocket";

export type BuildWorkerData = {
  project: ProjectResources;
  buildType: BuildType;
  projectRoot: string;
  tmpPath: string;
  engineSchema: EngineSchema;
  outputRoot: string;
  romFilename: string;
  make: boolean;
  debugEnabled?: boolean;
  l10nData: L10NLookup;
};

export type BuildTaskResponse =
  | {
      action: "progress";
      threadId: number;
      payload: {
        message: string;
      };
    }
  | {
      action: "warning";
      threadId: number;
      payload: {
        message: string;
      };
    }
  | {
      action: "complete";
      threadId: number;
      payload: BuildWorkerResult;
    };

export const buildProject = async ({
  project,
  projectRoot,
  engineSchema,
  tmpPath,
  outputRoot,
  romFilename,
  buildType,
  make,
  debugEnabled,
  l10nData,
}: BuildWorkerData): Promise<BuildWorkerResult> => {
  let artifacts: BuildArtifacts;
  try {
    setL10NData(l10nData);
    const scriptEventHandlers = await loadAllScriptEventHandlers(projectRoot);
    const compiledData = await compileData(project, {
      projectRoot,
      engineSchema,
      scriptEventHandlers,
      tmpPath,
      debugEnabled,
      progress,
      warnings,
    });
    const { pluginAttribution } = await ejectBuild({
      projectRoot,
      tmpPath,
      projectData: project,
      engineSchema,
      outputRoot,
      compiledData,
      progress,
      warnings,
    });
    await validateEjectedBuild({
      buildRoot: outputRoot,
      progress,
      warnings,
    });
    const buildSources = await resolveBuildSources(
      outputRoot,
      pluginAttribution,
    );
    const manifest = createBuildManifest({
      buildRoot: outputRoot,
      romFilename,
      cartType: project.settings.cartType,
      sources: buildSources,
    });
    artifacts = { compiledData, manifest };
  } catch (error) {
    return {
      status: "failed",
      stage: "prepare",
      error: error instanceof Error ? error.toString() : String(error),
    };
  }

  if (make) {
    try {
      await makeBuild({
        buildRoot: outputRoot,
        romFilename,
        tmpPath,
        buildType,
        data: project,
        debug: project.settings.generateDebugFilesEnabled,
        progress,
        warnings,
        manifest: artifacts.manifest,
      });
    } catch (error) {
      return {
        status: "failed",
        stage: "make",
        error: error instanceof Error ? error.toString() : String(error),
        ...artifacts,
      };
    }
  }

  return {
    status: "success",
    ...artifacts,
  };
};

const progress = (message: string) => {
  send({
    action: "progress",
    threadId,
    payload: {
      message,
    },
  });
};

const warnings = (message: string) => {
  send({
    action: "warning",
    threadId,
    payload: {
      message,
    },
  });
};

const send = (msg: BuildTaskResponse) => {
  parentPort?.postMessage?.(msg);
};

const run = async () => {
  const result = await buildProject(workerData);
  send({ action: "complete", threadId, payload: result });
  process.exit(0);
};

parentPort?.on("message", async (message: { action: string }) => {
  if (message.action === "terminate") {
    await cancelBuildCommandsInProgress();
    process.exit(1);
  }
});

if (!isMainThread) {
  run();
}
