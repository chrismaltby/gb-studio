import glob from "glob";
import { promisify } from "util";
import { eventsRoot } from "consts";
import {
  FileReaderFn,
  ScriptEventHandlerWithCleanup,
} from "lib/scriptEventsHandlers/handlerTypes";
import { readFile, readFileSync } from "fs-extra";
import { loadScriptEventHandlerFromUntrustedString } from "lib/scriptEventsHandlers/untrustedHandler";
import { loadScriptEventHandlerFromTrustedString } from "lib/scriptEventsHandlers/trustedHandler";
import { dirname, join } from "path";
import { isAssetWithinProject } from "lib/helpers/assets";
import l10n from "shared/lib/lang/l10n";

const globAsync = promisify(glob);

const eventHandlers: Record<string, ScriptEventHandlerWithCleanup> = {};

const fileCache = new Map<string, string | Buffer>();

const loadUntrustedScriptEventHandler = async (
  path: string,
  fileReader: FileReaderFn,
): Promise<ScriptEventHandlerWithCleanup> => {
  const handlerCode = await readFile(path, "utf8");
  return loadScriptEventHandlerFromUntrustedString(
    handlerCode,
    path,
    fileReader,
  );
};

const loadTrustedScriptEventHandler = async (
  path: string,
  fileReader: FileReaderFn,
): Promise<ScriptEventHandlerWithCleanup> => {
  const handlerCode = await readFile(path, "utf8");
  return loadScriptEventHandlerFromTrustedString(handlerCode, path, fileReader);
};

const cleanupScriptEventHandlers = () => {
  for (const key in eventHandlers) {
    const handler = eventHandlers[key];
    if (handler) {
      handler.cleanup();
      delete eventHandlers[key];
    }
  }
};

const cleanupFileCache = () => {
  fileCache.clear();
};

const cacheKey = (absPath: string, enc?: BufferEncoding) =>
  `${absPath}::${enc ?? "<binary>"}`;

const createFileReaderForHandler = (pluginPath: string): FileReaderFn => {
  const dirPath = dirname(pluginPath);

  function readPluginFile(filePath: string, encoding: "utf8"): string;
  function readPluginFile(
    filePath: string,
    encoding?: BufferEncoding,
  ): string | Buffer;

  function readPluginFile(filePath: string, encoding?: BufferEncoding) {
    const absPath = join(dirPath, filePath);
    guardFileWithinPlugin(absPath, dirPath);

    const key = cacheKey(absPath, encoding);
    const cached = fileCache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = readFileSync(absPath, encoding);
    fileCache.set(key, value);
    return value;
  }

  return readPluginFile;
};

export const guardFileWithinPlugin = (
  assetPath: string,
  projectRoot: string,
) => {
  if (!isAssetWithinProject(assetPath, projectRoot)) {
    throw new Error(
      l10n("ERROR_FILE_DOESNT_BELONG_TO_CURRENT_PLUGIN", { file: assetPath }),
    );
  }
};

const loadAllScriptEventHandlers = async (projectRoot: string) => {
  cleanupScriptEventHandlers();
  cleanupFileCache();

  const forceUntrusted = process.env.FORCE_QUICKJS_PLUGINS === "true";

  const corePaths = await globAsync(`${eventsRoot}/event*.js`);

  const pluginPaths = await globAsync(
    `${projectRoot}/plugins/*/**/events/event*.js`,
  );

  const trustedHandler = forceUntrusted
    ? loadUntrustedScriptEventHandler
    : loadTrustedScriptEventHandler;

  for (const path of corePaths) {
    const handler = await trustedHandler(
      path,
      createFileReaderForHandler(path),
    );
    eventHandlers[handler.id] = handler;
  }
  for (const path of pluginPaths) {
    const handler = await loadUntrustedScriptEventHandler(
      path,
      createFileReaderForHandler(path),
    );
    eventHandlers[handler.id] = handler;
  }

  return eventHandlers;
};

export default loadAllScriptEventHandlers;
