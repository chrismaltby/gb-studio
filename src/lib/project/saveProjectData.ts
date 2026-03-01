import { ensureDir, remove } from "fs-extra";
import glob from "glob";
import { promisify } from "util";
import { writeFileWithBackupAsync } from "lib/helpers/fs/writeFileWithBackup";
import Path from "path";
import { WriteResourcesPatch } from "shared/lib/resources/types";
import promiseLimit from "lib/helpers/promiseLimit";
import { uniq, throttle } from "lodash";
import { pathToPosix } from "shared/lib/helpers/path";
import { encodeResource } from "shared/lib/resources/save";

const CONCURRENT_RESOURCE_SAVE_COUNT = 8;

const globAsync = promisify(glob);

// Normalize paths to ensure consistent comparison and file operations with unicode across different OSes
// Note: Only use on relative paths (never full OS paths)
const normalizeResourcePath = (p: string): string => {
  if (Path.isAbsolute(p)) {
    throw new Error(
      "normalizeResourcePath must only be used with project-relative paths",
    );
  }
  return pathToPosix(p).normalize("NFC");
};

interface SaveProjectDataOptions {
  progress?: (completed: number, total: number) => void;
}

const saveProjectData = async (
  projectPath: string,
  patch: WriteResourcesPatch,
  options?: SaveProjectDataOptions,
) => {
  const writeBuffer = patch.data;
  const metadata = patch.metadata;

  const projectFolder = Path.dirname(projectPath);

  let completedCount = 0;

  const notifyProgress = throttle(() => {
    options?.progress?.(completedCount, writeBuffer.length);
  }, 50);

  const existingResourcePaths = new Set(
    (
      await globAsync(
        Path.join(projectFolder, "{project,assets,plugins}", "**/*.gbsres"),
      )
    ).map((absolutePath) =>
      normalizeResourcePath(Path.relative(projectFolder, absolutePath)),
    ),
  );

  const expectedResourcePaths: Set<string> = new Set(
    patch.paths.map(normalizeResourcePath),
  );

  const resourceDirPaths = uniq(
    writeBuffer.map(({ path }) => normalizeResourcePath(Path.dirname(path))),
  );

  await promiseLimit(
    CONCURRENT_RESOURCE_SAVE_COUNT,
    resourceDirPaths.map((relativeDir) => async () => {
      await ensureDir(Path.join(projectFolder, relativeDir));
    }),
  );

  notifyProgress();

  // Write files using normalized resource paths
  await promiseLimit(
    CONCURRENT_RESOURCE_SAVE_COUNT,
    writeBuffer.map(({ path, data }) => async () => {
      const normalizedPath = normalizeResourcePath(path);
      await writeFileWithBackupAsync(
        Path.join(projectFolder, normalizedPath),
        data,
      );
      completedCount++;
      notifyProgress();
    }),
  );

  await writeFileWithBackupAsync(
    projectPath,
    encodeResource("project", metadata),
  );

  const resourceDiff = Array.from(existingResourcePaths).filter(
    (path) => !expectedResourcePaths.has(path),
  );

  // Remove previous project files that are no longer needed
  for (const relativePath of resourceDiff) {
    const removePath = Path.join(projectFolder, relativePath);
    await remove(removePath);
  }
};

export default saveProjectData;
