import { access, constants, copyFile, renameSync } from "fs";
import {
  WriteFileAndFlushOptions,
  writeFileAndFlush,
} from "./writeFileAndFlush";

const BACKUP_EXTENSION = "bak";
const TMP_EXTENSION = "new";

export const backupFile = (
  path: string,
  callback: (err?: NodeJS.ErrnoException | null) => void
) => {
  access(path, constants.F_OK, (err) => {
    if (!err) {
      return copyFile(path, `${path}.${BACKUP_EXTENSION}`, callback);
    }
    return callback();
  });
};

export const writeFileWithBackup = (
  path: string,
  data: string | NodeJS.ArrayBufferView,
  options: WriteFileAndFlushOptions | BufferEncoding,
  callback: (err?: NodeJS.ErrnoException | unknown | null) => void
) => {
  return backupFile(path, (backupError) => {
    if (backupError) {
      return callback(backupError);
    }
    return writeFileAndFlush(
      `${path}.${TMP_EXTENSION}`,
      data,
      options,
      (writeError) => {
        if (writeError) {
          return callback(writeError);
        }
        try {
          renameSync(`${path}.new`, path);
        } catch (e) {
          return callback(e);
        }
        return callback();
      }
    );
  });
};

export const writeFileWithBackupAsync = (
  path: string,
  data: string | NodeJS.ArrayBufferView,
  options: WriteFileAndFlushOptions | BufferEncoding = "utf8"
) => {
  return new Promise<void>((resolve, reject) => {
    writeFileWithBackup(path, data, options, (err) => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
};
