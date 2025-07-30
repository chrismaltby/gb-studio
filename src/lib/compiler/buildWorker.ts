import { parentPort, workerData, isMainThread, threadId } from "worker_threads";
import loadAllScriptEventHandlers from "lib/project/loadScriptEventHandlers";
import compileData from "./compileData";
import { ProjectResources } from "shared/lib/resources/types";
import { L10NLookup, setL10NData } from "shared/lib/lang/l10n";
import ejectBuild from "./ejectBuild";
import { validateEjectedBuild } from "./validate/validateEjectedBuild";
import makeBuild, { cancelBuildCommandsInProgress } from "./makeBuild";
import { EngineSchema } from "lib/project/loadEngineSchema";

export type BuildType = "rom" | "web" | "pocket";

export type BuildWorkerData = {
  project: ProjectResources;
  buildType: BuildType;
  projectRoot: string;
  tmpPath: string;
  engineSchema: EngineSchema;
  outputRoot: string;
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
      payload: Awaited<ReturnType<typeof compileData>>;
    };

let terminating = false;

const buildProject = async ({
  project,
  projectRoot,
  engineSchema,
  tmpPath,
  outputRoot,
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
    await makeBuild({
      buildRoot: outputRoot,
      tmpPath,
      buildType,
      data: project,
      debug: project.settings.generateDebugFilesEnabled,
      progress,
      warnings,
    });
  }

  return compiledData;
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
    process.exit(1);
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
