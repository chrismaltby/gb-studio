import { createReadStream, readFile } from "fs-extra";
import crypto from "crypto";
import { md5 } from "hash-wasm";

export const checksumFile = (path: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha1");
    const stream = createReadStream(path);
    stream.on("error", (err) => reject(err));
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
};

export const checksumMD5File = async (path: string): Promise<string> => {
  const file = await readFile(path);
  return md5(file);
};

export const checksumString = (string: string): string => {
  const hash = crypto.createHash("sha1");
  hash.update(string);
  return hash.digest("hex");
};
