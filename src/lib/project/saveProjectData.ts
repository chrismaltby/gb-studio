/* eslint-disable @typescript-eslint/no-unused-vars */
import { ensureDir, pathExists, remove } from "fs-extra";
import glob from "glob";
import { promisify } from "util";
import { writeFileAndFlushAsync } from "lib/helpers/fs/writeFileAndFlush";
import { writeFileWithBackupAsync } from "lib/helpers/fs/writeFileWithBackup";
import Path from "path";
import { WriteResourcesPatch } from "shared/lib/resources/types";
import promiseLimit from "lib/helpers/promiseLimit";
import { uniq } from "lodash";
import { pathToPosix } from "shared/lib/helpers/path";

const CONCURRENT_RESOURCE_SAVE_COUNT = 8;

const globAsync = promisify(glob);

export const encodeResource = <T extends Record<string, unknown>>(
  resourceType: string,
  data: T
): string => {
  const {
    // Extract id so it can be moved to top of data
    id,
    // Remove internal data so it isn't stored to disk
    __type,
    // Extract remaining data to write to disk
    ...rest
  } = data;
  return JSON.stringify(
    {
      _resourceType: resourceType,
      id,
      ...rest,
    },
    null,
    2
  );
};

const saveProjectData = async (
  projectPath: string,
  patch: WriteResourcesPatch
) => {
  console.time("SAVING PROJECT");
  console.log("SAVE PROJECT DATA" + projectPath);

  const writeBuffer = patch.data;
  const metadata = patch.metadata;

  const projectFolder = Path.dirname(projectPath);
  const projectPartsFolder = Path.join(projectFolder, "project");

  console.time("SAVING PROJECT : existingResourcePaths");

  const existingResourcePaths = new Set(
    (await globAsync(Path.join(projectPartsFolder, "**/*.gbsres"))).map(
      (path) => pathToPosix(Path.relative(projectFolder, path))
    )
  );
  const expectedResourcePaths: Set<string> = new Set(patch.paths);
  console.timeEnd("SAVING PROJECT : existingResourcePaths");

  let forceWrite = true;
  if (await pathExists(projectPartsFolder)) {
    // await copy(projectPartsFolder, projectPartsBckFolder);
    forceWrite = false;
  }

  console.time("Ensure Resource Dirs");
  const resourceDirPaths = uniq(
    writeBuffer.map(({ path }) => Path.dirname(path))
  );
  console.log("resourceDirPaths");
  console.log(resourceDirPaths);
  await promiseLimit(
    CONCURRENT_RESOURCE_SAVE_COUNT,
    resourceDirPaths.map((path) => async () => {
      await ensureDir(Path.join(projectFolder, path));
    })
  );
  console.timeEnd("Ensure Resource Dirs");

  console.log("WRITE BUFFER SIZE=" + writeBuffer.length);
  console.time("Flush Write Buffer");
  await promiseLimit(
    CONCURRENT_RESOURCE_SAVE_COUNT,
    writeBuffer.map(({ path, data }) => async () => {
      console.log("WRITE FILE", path);
      await writeFileWithBackupAsync(Path.join(projectFolder, path), data);
    })
  );
  console.timeEnd("Flush Write Buffer");

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
    console.log("WANTING TO REMOVE...", removePath);
    await remove(removePath);
  }

  console.timeEnd("SAVING PROJECT");
};

export default saveProjectData;
