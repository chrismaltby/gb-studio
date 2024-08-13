import { ensureDir, remove } from "fs-extra";
import glob from "glob";
import { promisify } from "util";
import { writeFileWithBackupAsync } from "lib/helpers/fs/writeFileWithBackup";
import Path from "path";
import { WriteResourcesPatch } from "shared/lib/resources/types";
import promiseLimit from "lib/helpers/promiseLimit";
import { uniq } from "lodash";
import { pathToPosix } from "shared/lib/helpers/path";
import { encodeResource } from "shared/lib/resources/save";

const CONCURRENT_RESOURCE_SAVE_COUNT = 8;

const globAsync = promisify(glob);

interface SaveProjectDataOptions {
  progress?: (completed: number, total: number) => void;
}

const saveProjectData = async (
  projectPath: string,
  patch: WriteResourcesPatch,
  options?: SaveProjectDataOptions
) => {
  const writeBuffer = patch.data;
  const metadata = patch.metadata;

  const projectFolder = Path.dirname(projectPath);
  const projectPartsFolder = Path.join(projectFolder, "project");

  let completedCount = 0;

  const notifyProgress = () => {
    options?.progress?.(completedCount, writeBuffer.length);
  };

  const existingResourcePaths = new Set(
    (await globAsync(Path.join(projectPartsFolder, "**/*.gbsres"))).map(
      (path) => pathToPosix(Path.relative(projectFolder, path))
    )
  );
  const expectedResourcePaths: Set<string> = new Set(patch.paths);

  const resourceDirPaths = uniq(
    writeBuffer.map(({ path }) => Path.dirname(path))
  );

  await promiseLimit(
    CONCURRENT_RESOURCE_SAVE_COUNT,
    resourceDirPaths.map((path) => async () => {
      await ensureDir(Path.join(projectFolder, path));
    })
  );

  notifyProgress();

  await promiseLimit(
    CONCURRENT_RESOURCE_SAVE_COUNT,
    writeBuffer.map(({ path, data }) => async () => {
      await writeFileWithBackupAsync(Path.join(projectFolder, path), data);
      completedCount++;
      notifyProgress();
    })
  );

  await writeFileWithBackupAsync(
    projectPath,
    encodeResource("project", metadata)
  );

  const resourceDiff = Array.from(existingResourcePaths).filter(
    (path) => !expectedResourcePaths.has(path)
  );

  // Remove previous project files that are no longer needed
  for (const path of resourceDiff) {
    const removePath = Path.join(projectFolder, path);
    await remove(removePath);
  }
};

export default saveProjectData;
