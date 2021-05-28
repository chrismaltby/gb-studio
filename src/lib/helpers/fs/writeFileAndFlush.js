/* eslint-disable no-param-reassign */
import { open, writeFile, close, fdatasync } from "fs";

export const writeFileAndFlush = (path, data, options, callback) => {
  if (typeof options === "function") {
    callback = options;
    options = null;
  }

  if (!options) {
    options = { encoding: "utf8", mode: 0o666, flag: "w" };
  } else if (typeof options === "string") {
    options = { encoding: options, mode: 0o666, flag: "w" };
  }

  // Open the file with same flags and mode as fs.writeFile()
  open(path, options.flag, options.mode, (openError, fd) => {
    if (openError) {
      return callback(openError);
    }

    // It is valid to pass a fd handle to fs.writeFile() and this will keep the handle open!
    return writeFile(fd, data, options.encoding, (writeError) => {
      if (writeError) {
        return close(fd, () => callback(writeError)); // still need to close the handle on error!
      }

      // Flush contents (not metadata) of the file to disk
      return fdatasync(fd, (syncError) => {
        return close(fd, (closeError) => callback(syncError || closeError)); // make sure to carry over the fdatasync error if any!
      });
    });
  });
};

export const writeFileAndFlushAsync = (path, data, options) => {
  return new Promise((resolve, reject) => {
    writeFileAndFlush(path, data, options, (err) => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
};
