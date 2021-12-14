/* eslint-disable no-param-reassign */
import { access, constants, copyFile, renameSync } from "fs";
import { writeFileAndFlush } from "./writeFileAndFlush";

const BACKUP_EXTENSION = "bak";
const TMP_EXTENSION = "new";

export const backupFile = (path, callback) => {
  access(path, constants.F_OK, (err) => {
    if (!err) {
      return copyFile(path, `${path}.${BACKUP_EXTENSION}`, callback);
    }
    return callback();
  });
};

export const writeFileWithBackup = (path, data, options, callback) => {
  if (typeof options === "function") {
    callback = options;
    options = null;
  }
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

export const writeFileWithBackupAsync = (path, data, options) => {
  return new Promise((resolve, reject) => {
    writeFileWithBackup(path, data, options, (err) => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
};
