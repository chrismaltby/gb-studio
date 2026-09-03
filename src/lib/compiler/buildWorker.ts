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

type CompiledData = Awaited<ReturnType<typeof compileData>>;

export type BuildResult =
  | {
      status: "success";
      compiledData: CompiledData;
    }
  | {
      status: "failed";
      error: string;
    }
  | {
      status: "cancelled";
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
      payload: BuildResult;
    };

let terminating = false;

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
}: BuildWorkerData) => {
  // Initialise l10n
  setL10NData(l10nData);

  // Load script event handlers + plugins
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

  await ejectBuild({
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

  if (make) {
    const buildSources = await resolveBuildSources(outputRoot);
    const manifest = createBuildManifest({
      buildRoot: outputRoot,
      romFilename,
      cartType: project.settings.cartType,
      sources: buildSources,
    });
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
        manifest,
      });
    } catch (error) {
      const cancelled =
        terminating ||
        (error instanceof Error && error.message === "BUILD_CANCELLED");
      if (cancelled) {
        return { status: "cancelled" } as const;
      }
      return {
        status: "failed",
        error: error instanceof Error ? error.toString() : String(error),
      } as const;
    }
  }

  return {
    status: "success",
    compiledData,
  } as const;
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
  try {
    const res = await buildProject(workerData);
    send({ action: "complete", threadId, payload: res });
    process.exit(0);
  } catch (e) {
    if (terminating) {
      return;
    }
    warnings(String(e));
    console.error("buildTask process terminated with error:", e);
    send({
      action: "complete",
      threadId,
      payload: {
        status: "failed",
        error: e instanceof Error ? e.toString() : String(e),
      },
    });
    process.exit(0);
  }
};

parentPort?.on("message", async (message: { action: string }) => {
  if (message.action === "terminate") {
    terminating = true;
    await cancelBuildCommandsInProgress();
    process.exit(1);
  }
});

if (!isMainThread) {
  run();
}
