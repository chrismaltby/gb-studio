import { access, constants, copyFile, rename, writeFile } from "fs-extra";

const BACKUP_EXTENSION = "bak";
const TMP_EXTENSION = "new";

export const writeFileWithBackupAsync = async (
  path: string,
  data: string | NodeJS.ArrayBufferView,
  options: BufferEncoding | { encoding?: BufferEncoding } = "utf8",
): Promise<void> => {
  const tmpPath = `${path}.${TMP_EXTENSION}`;
  const bakPath = `${path}.${BACKUP_EXTENSION}`;

  // Create backup if original exists
  try {
    await access(path, constants.F_OK);
    await copyFile(path, bakPath);
  } catch {
    // File does not exist, no backup needed
  }

  // Write .new file and replace existing
  await writeFile(tmpPath, data, options);
  await rename(tmpPath, path);
};
