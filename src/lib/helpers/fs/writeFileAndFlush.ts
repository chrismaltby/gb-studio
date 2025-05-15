import { open, writeFile, close, fdatasync, WriteFileOptions } from "fs";

export interface WriteFileAndFlushOptions {
  encoding: BufferEncoding;
  mode: string | number | null | undefined;
  flag: string;
}

export const writeFileAndFlush = (
  path: string,
  data: string | NodeJS.ArrayBufferView,
  options: WriteFileAndFlushOptions | BufferEncoding,
  callback: (err?: NodeJS.ErrnoException | null) => void
) => {
  // If options passed in as a string convert to WriteFileAndFlushOptions
  const writeOptions: WriteFileOptions =
    typeof options === "string"
      ? { encoding: options, mode: 0o666, flag: "w" }
      : {
          ...options,
          mode: options.mode ?? 0o666,
        };

  // Open the file with same flags and mode as fs.writeFile()
  open(path, writeOptions.flag, writeOptions.mode, (openError, fd) => {
    if (openError) {
      return callback(openError);
    }

    // It is valid to pass a fd handle to fs.writeFile() and this will keep the handle open!
    return writeFile(fd, data, writeOptions, (writeError) => {
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

export const writeFileAndFlushAsync = (
  path: string,
  data: string | NodeJS.ArrayBufferView,
  options: WriteFileAndFlushOptions | BufferEncoding = "utf8"
) => {
  return new Promise<void>((resolve, reject) => {
    writeFileAndFlush(path, data, options, (err) => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
};
